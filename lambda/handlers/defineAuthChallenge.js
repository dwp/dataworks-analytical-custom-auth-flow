const getUserDetails = require('../aws/getUserDetails').getUserDetails;

module.exports = async function defineAuthChallenge(event) {
    let userDetails = await getUserDetails(event.userPoolId, event.userName)
    let existingMFA = (userDetails.PreferredMfaSetting === "SOFTWARE_TOKEN_MFA")

    const { session } = event.request;

    /* Verify password*/
    if (session.length === 1 && session[0].challengeName === 'SRP_A') {
        event.response.issueTokens = false;
        event.response.failAuthentication = false;
        event.response.challengeName = 'PASSWORD_VERIFIER';
        /* Issue custom challenge if user entered correct password but doesn't have MFA setup */
    } else if (!existingMFA && session.length === 2 && session[1].challengeName === 'PASSWORD_VERIFIER' && session[1].challengeResult === true) {
        event.response.issueTokens = false;
        event.response.failAuthentication = false;
        event.response.challengeName = 'CUSTOM_CHALLENGE';
    } else if ((existingMFA && session[1].challengeName === 'PASSWORD_VERIFIER' && session[1].challengeResult === true) // Issue tokens if user has mfa and correct password
        ||
        (session.length === 3 && session[2].challengeName === 'CUSTOM_CHALLENGE' && session[2].challengeResult === true)) { // Issue tokens if user answered correctly to custom challenge
        event.response.issueTokens = true;
        event.response.failAuthentication = false;
    } else if (session[1].challengeName === 'PASSWORD_VERIFIER' && session[1].challengeResult === false) {
        event.response.issueTokens = false;
        event.response.failAuthentication = true;
    } else {
        event.response.issueTokens = false;
        event.response.failAuthentication = true;
    }

    return await event;
}
