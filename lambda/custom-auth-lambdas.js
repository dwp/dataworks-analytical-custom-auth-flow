const AWS = require("aws-sdk");
const crypto = require("crypto-secure-random-digit");
const sendSMS = require('./aws/sendSMS.js').sendSMS
const getUserDetails = require('./aws/getUserDetails').getUserDetails;


module.exports.createAuthChallenge = async (event = {}, context) => {

    const userPhoneNumber = event.request.userAttributes.phone_number;
    if (!userPhoneNumber) throw new Error("No phone number provided");

    const oneTimeAuthCode = crypto.randomDigits(6).join('');
    await sendSMS(userPhoneNumber, oneTimeAuthCode, event.userName);

    event.response.privateChallengeParameters = {otp: oneTimeAuthCode};
    return event
}

module.exports.defineAuthChallenge = async (event, context) => {
    let userDetails = await getUserDetails(event.userPoolId, event.userName)
    let existingMFA = (userDetails.PreferredMfaSetting === "SOFTWARE_TOKEN_MFA")

    const {session} = event.request;

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
        || (session.length === 3 && session[2].challengeName === 'CUSTOM_CHALLENGE' && session[2].challengeResult === true)) { // Issue tokens if user answered correctly to custom challenge
        event.response.issueTokens = true;
        event.response.failAuthentication = false;
    } else {
        event.response.issueTokens = false;
        event.response.failAuthentication = true;
    }

    return await event;
}

module.exports.verifyAuthChallenge = async (event) => {
    const oneTimeAuthCode = event.request.privateChallengeParameters.otp;
    event.response.answerCorrect = event.request.challengeAnswer === oneTimeAuthCode;
    return event
}
