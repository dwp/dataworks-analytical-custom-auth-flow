import AWS from 'aws-sdk';

const {TABLE_NAME, AWS_REGION} = process.env;
const USER_EXPIRY_MONTHS = process.env.USER_EXPIRY_MONTHS ? process.env.USER_EXPIRY_MONTHS : 3;
const MAX_INCORRECT_ATTEMPTS = process.env.MAX_INCORRECT_ATTEMPTS ? process.env.MAX_INCORRECT_ATTEMPTS : 10;

const ddb = new AWS.DynamoDB({region: AWS_REGION});

function userFromDdb(ddbItem) {
    return {
        username: ddbItem['username'],
        creationDate: ddbItem['creation_date'],
        expirationDate: ddbItem['expiration_date'],
        lastLoggedIn: ddbItem['last_logged_in'],
        incorrectPasswordAttempts: ddbItem['incorrect_password_attempts'] ? ddbItem['incorrect_password_attempts'] : 0,
    }
}

export default class UserHandler {

    async getUser(username) {
        const item = await ddb.getItem({
            Key: {username: {S: username}},
            TableName: TABLE_NAME,
        }).then(res => res.data.Item);

        return item ? userFromDdb(item) : null;
    }

    async createUser(username) {
        const creationDate = new Date();
        const expirationDate = new Date(creationDate.getTime()).setMonth(creationDate.getMonth() + USER_EXPIRY_MONTHS);

        try {
            return ddb.putItem({
                Item: {
                    username: {S: username},
                    'creation_date': {S: creationDate.toISOString()},
                    'expiration_date': {S: expirationDate.toISOString()},
                },
                TableName: TABLE_NAME
            });
        } catch (e) {
            console.error(`Failed to create new user ${username} in DynamoDB table ${TABLE_NAME}. Error: ` + JSON.stringify(e));
        }
    }

    async updateUserLastLoggedIn(username) {
        return ddb.updateItem({
            Key: {username},
            UpdateExpression: 'SET #LLL = :last_logged_in',
            ExpressionAttributeNames: {'#LLL': "last_logged_in"},
            ExpressionAttributeValues: {':last_logged_in': new Date().toISOString()},
            TableName: TABLE_NAME
        })
    }

    async isExpired(username) {
        const user = await this.getUser(username);
        return Date.parse(user.expirationDate) < Date.now();
    }

    async isMaxIncorrectAttempts(username) {
        const user = await this.getUser(username);
        return user.incorrectPasswordAttempts >= MAX_INCORRECT_ATTEMPTS;
    }

    async incrementIncorrectAttempts(username) {
        const user = await this.getUser(username);

        return ddb.updateItem({
            Key: {username},
            UpdateExpression: 'SET #IPA = :incorrect_password_attempts',
            ExpressionAttributeNames: {'#IPA': "incorrect_password_attempts"},
            ExpressionAttributeValues: {':incorrect_password_attempts': user.incorrectPasswordAttempts + 1},
            TableName: TABLE_NAME
        })
    }

    async clearIncorrectAttempts(username) {
        return ddb.updateItem({
                Key: {username},
                UpdateExpression: 'SET #IPA = :incorrect_password_attempts',
                ExpressionAttributeNames: {'#IPA': "incorrect_password_attempts"},
                ExpressionAttributeValues: {':incorrect_password_attempts': 0},
                TableName: TABLE_NAME
            }
        )
    }

    getExtendedUserNameFromEvent(cognitoTriggerEvent) {
        const {userName} = cognitoTriggerEvent;
        const {sub} = cognitoTriggerEvent.request.userAttributes;
        return userName + sub.slice(0, 3);
    }

}
