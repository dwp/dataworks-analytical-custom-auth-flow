import UserHandler from "../aws/UserHandler";

const userHandler = new UserHandler();

export default async function preAuth(event) {
    const username = userHandler.getExtendedUserNameFromEvent(event);

    const user = await userHandler.getUser(username);
    if (!user) return userHandler.createUser(username);
    if (await userHandler.isUserExpired(username)) {
        throw new Error(`User ${username} expired on ${user.expirationDate}`)
    }
}
