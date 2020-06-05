const UserHandler = require( "../aws/UserHandler");
const {UserExposedError} = require("../errors");

const userHandler = new UserHandler();

module.exports = async function preAuth(event) {
    const username = userHandler.getExtendedUserNameFromEvent(event);

    const user = await userHandler.getUser(username);
    if (!user) {
        await userHandler.createUser(username);
        return event;
    }

    if (await userHandler.isExpired(username)) {
        console.warn(`User ${username} expired on ${user.expirationDate}`);
        throw new UserExposedError(`Your user account is expired. Please contact support to regain access.`);
    }

    if (await userHandler.isInactive(username)) {
        console.warn(`User ${username} has been inactive since ${user.lastLoggedIn}. Blocking access.`);
        throw new UserExposedError(`Your user acccount has been inactive for longer than the allowed period. Please contact support to regain access.`)
    }

    if (await userHandler.isMaxIncorrectAttempts(username)) {
        console.warn(`User ${username} has reached the maximum number of incorrect password attempts. Forcing reset password.`);
        await userHandler.cognitoResetPassword(username, event.userPoolId);
        throw new UserExposedError(`Maximum incorrect password attempts reached. Password reset required.`)
    }

    /* Assume this is an incorrect password attempt, it will
     be cleared if login is successful in the postAuth handler */
    await userHandler.incrementIncorrectAttempts(username);
    return event;
}
