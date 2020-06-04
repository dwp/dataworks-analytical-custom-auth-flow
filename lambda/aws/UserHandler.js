const AWS = require('aws-sdk');

const {TABLE_NAME} = process.env;
const USER_EXPIRY_MONTHS = process.env.USER_EXPIRY_MONTHS ? process.env.USER_EXPIRY_MONTHS : 3;
const MAX_INCORRECT_ATTEMPTS = process.env.MAX_INCORRECT_ATTEMPTS ? process.env.MAX_INCORRECT_ATTEMPTS : 10;

const ddb = new AWS.DynamoDB();
const cognito = new AWS.CognitoIdentityServiceProvider();


function userFromDdb(ddbItem) {
    return {
        username: ddbItem['username'].S,
        creationDate: new Date(ddbItem['creation_date'].S),
        expirationDate: new Date(ddbItem['expiration_date'].S),
        lastLoggedIn: ddbItem['last_logged_in'] ? new Date(ddbItem['last_logged_in'].S) : null,
        incorrectPasswordAttempts: ddbItem['incorrect_password_attempts'] ? parseInt(ddbItem['incorrect_password_attempts'].N, 10) : 0,
    }
}

module.exports = class UserHandler {

    async getUser(username) {
        const item = await ddb.getItem({
            Key: {username: {S: username}},
            TableName: String(TABLE_NAME),
        }).promise().then(res => res.Item);

        return item ? userFromDdb(item) : null;
    }

    async createUser(username) {
        const creationDate = new Date();
        const expirationDate = new Date(creationDate.getTime());
        expirationDate.setMonth(creationDate.getMonth() + USER_EXPIRY_MONTHS);

        return await ddb.putItem({
            Item: {
                username: {S: username},
                'creation_date': {S: creationDate.toISOString()},
                'expiration_date': {S: expirationDate.toISOString()},
            },
            TableName: TABLE_NAME
        }).promise();
    }

    async updateUserLastLoggedIn(username) {
        return ddb.updateItem({
            Key: {username: {S: username}},
            UpdateExpression: 'SET #LLL = :last_logged_in',
            ExpressionAttributeNames: {'#LLL': "last_logged_in"},
            ExpressionAttributeValues: {':last_logged_in': {S: new Date().toISOString()}},
            TableName: String(TABLE_NAME)
        }).promise();
    }

    async isExpired(username) {
        const user = await this.getUser(username);
        return user.expirationDate < Date.now();
    }

    async isMaxIncorrectAttempts(username) {
        const user = await this.getUser(username);
        return user.incorrectPasswordAttempts >= MAX_INCORRECT_ATTEMPTS;
    }

    async incrementIncorrectAttempts(username) {
        const user = await this.getUser(username);

        return ddb.updateItem({
            Key: {username: {S: username}},
            UpdateExpression: 'SET #IPA = :incorrect_password_attempts',
            ExpressionAttributeNames: {'#IPA': "incorrect_password_attempts"},
            ExpressionAttributeValues: {':incorrect_password_attempts': {N: String(user.incorrectPasswordAttempts + 1)}},
            TableName: String(TABLE_NAME)
        }).promise();
    }

    async clearIncorrectAttempts(username) {
        return ddb.updateItem({
                Key: {username: {S: username}},
                UpdateExpression: 'SET #IPA = :incorrect_password_attempts',
                ExpressionAttributeNames: {'#IPA': "incorrect_password_attempts"},
                ExpressionAttributeValues: {':incorrect_password_attempts': {N: String(0)}},
                TableName: TABLE_NAME
            }
        ).promise();
    }

    async cognitoResetPassword(username, userPoolId) {
        return cognito.adminResetUserPassword({
            Username: this.getCognitoUsernameFromExtended(username),
            UserPoolId: userPoolId
        }).promise();
    }

    getCognitoUsernameFromExtended(extendedUsername){
        return extendedUsername.substring(0, extendedUsername.length - 3)
    }

    getExtendedUserNameFromEvent(cognitoTriggerEvent) {
        const {userName} = cognitoTriggerEvent;
        const {sub} = cognitoTriggerEvent.request.userAttributes;
        return userName + sub.slice(0, 3);
    }

}
