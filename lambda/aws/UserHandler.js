import AWS from 'aws-sdk';

const {TABLE_NAME, AWS_REGION} = process.env;
const USER_EXPIRY_MONTHS = process.env.USER_EXPIRY_MONTHS ? process.env.USER_EXPIRY_MONTHS : 3;

const ddb = new AWS.DynamoDB({region: AWS_REGION});

function userFromDdb(ddbItem){
    return {
        username: ddbItem['username'],
        creationDate: ddbItem['creation_date'],
        expirationDate: ddbItem['expiration_date'],
        lastLoggedIn: ddbItem['last_logged_in'],
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

    async isUserExpired(username) {
        const user = await this.getUser(username);
        return Date.parse(user.expirationDate) < Date.now();
    }

    getExtendedUserNameFromEvent(cognitoTriggerEvent){
        const {userName} = cognitoTriggerEvent;
        const {sub} = cognitoTriggerEvent.request.userAttributes;
        return userName + sub.slice(0, 3);
    }

}
