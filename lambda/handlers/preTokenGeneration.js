module.exports = async function preTokenGeneration(event) {
    if (event.triggerSource === "TokenGeneration_NewPasswordChallenge")
        throw new Error("Please sign in again")
    return event;
}
