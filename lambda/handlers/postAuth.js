const UserHandler = require("../aws/UserHandler");

const userHandler = new UserHandler();

module.exports = async function postAuth(event) {
    const username = userHandler.getExtendedUserNameFromEvent(event);

    await userHandler.updateUserLastLoggedIn(username);
    await userHandler.clearIncorrectAttempts(username);

    return event;
}
