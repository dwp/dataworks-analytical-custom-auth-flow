const UserHandler = require( "../aws/UserHandler");

const userHandler = new UserHandler();

module.exports = async function preAuth(event) {
    const username = userHandler.getExtendedUserNameFromEvent(event);

    const user = await userHandler.getUser(username);
    if (!user) return userHandler.createUser(username);

    if (await userHandler.isExpired(username)) {
        console.warn(`User ${username} expired on ${user.expirationDate}`);
        throw new Error(`Your user is expired. Please contact support.`);
    }

    if (await userHandler.isMaxIncorrectAttempts(username)) {
        console.warn(`User ${username} has reached the maximum number of incorrect password attempts. Forcing reset password.`);
        await userHandler.cognitoResetPassword(username, event.userPoolId);
        throw new Error(`Maximum incorrect password attempts reached. Password reset required.`)
    }

    /* Assume this is an incorrect password attempt, it will
     be cleared if login is successful in the postAuth handler */
    await userHandler.incrementIncorrectAttempts(username);
    return event;
}
