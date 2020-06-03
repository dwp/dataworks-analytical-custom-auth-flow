import UserTableHandler from "./aws/UserTableHandler";

const userTableHandler = new UserTableHandler();

export default async function preAuth(event) {
    const {username} = event;
    const {sub} = event.request.userAttributes;
    const extendedUsername = username + sub.slice(0, 3);

    const user = await userTableHandler.getUser(extendedUsername);
    if (!user) return userTableHandler.createUser(extendedUsername);
    if (await userTableHandler.isUserExpired(extendedUsername)) {
        throw new Error(`User ${extendedUsername} expired on ${user.expirationDate}`)
    }
}
