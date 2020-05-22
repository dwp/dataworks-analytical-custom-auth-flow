const AWS = require("aws-sdk");
const crypto = require("crypto-secure-random-digit");
const sendSMS = require('./aws/sendSMS.js').sendSMS
const getUserDetails = require('./aws/getUserDetails').getUserDetails;

module.exports.createAuthChallenge = async (event = {}, context) => {
    var mobileNumber = ()=> {
        if(event.request.userAttributes.phone_number == null||event.request.userAttributes.phone_number == undefined){
            throw new Error("No phone number provided")
        }
        else return event.request.userAttributes.phone_number;
    }
    oneTimeAuthCode = crypto.randomDigits(6).join('');
    await sendSMS(mobileNumber(), oneTimeAuthCode, event.userName)
    event.response.privateChallengeParameters = { "otp" : oneTimeAuthCode };
    
    return event
}

module.exports.defineAuthChallenge = async (event, context) => {
    let userDetails = await getUserDetails(event.userPoolId, event.userName)
    let existingMFA = (userDetails.PreferredMfaSetting == "SOFTWARE_TOKEN_MFA")

    if (event.request.session.length == 1 && event.request.session[0].challengeName == 'SRP_A') {
        event.response.issueTokens = false;
        event.response.failAuthentication = false;
        event.response.challengeName = 'PASSWORD_VERIFIER';
    } else if (!existingMFA && event.request.session.length == 2 && event.request.session[1].challengeName == 'PASSWORD_VERIFIER' && event.request.session[1].challengeResult == true) {
        event.response.issueTokens = false;
        event.response.failAuthentication = false;
        event.response.challengeName = 'CUSTOM_CHALLENGE';
    } else if ((existingMFA && event.request.session[1].challengeName == 'PASSWORD_VERIFIER' && event.request.session[1].challengeResult == true) || (event.request.session.length == 3 && event.request.session[2].challengeName == 'CUSTOM_CHALLENGE' && event.request.session[2].challengeResult == true)) {
        event.response.issueTokens = true;
        event.response.failAuthentication = false;
    } else {
        event.response.issueTokens = false;
        event.response.failAuthentication = true;
    }

    return await event;
}

module.exports.verifyAuthChallenge = async(event) => {
    const oneTimeAuthCode = event.request.privateChallengeParameters.otp;
    if(event.request.challengeAnswer === oneTimeAuthCode){
        event.response.answerCorrect = true;
    }
    else {
        event.response.answerCorrect = false;
    }
    return event
}
