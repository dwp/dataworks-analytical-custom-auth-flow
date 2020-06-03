import UserHandler from "../aws/UserHandler";

const userHandler = new UserHandler();

export default async function postAuth(event) {
    const username = userHandler.getExtendedUserNameFromEvent(event);

    await userHandler.updateUserLastLoggedIn(username);
    await userHandler.clearIncorrectAttempts(username);
}
