const {UserExposedError} = require("../errors");
module.exports = async function preTokenGeneration(event) {
    if (event.triggerSource === "TokenGeneration_NewPasswordChallenge")
        throw new UserExposedError("Please sign in again")
    return event;
}
