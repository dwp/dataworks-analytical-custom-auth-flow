const crypto = require("crypto-secure-random-digit");
const sendSMS = require('../aws/sendSMS.js').sendSMS

module.exports = async function createAuthChallenge(event) {

    const userPhoneNumber = event.request.userAttributes.phone_number;
    if (!userPhoneNumber) throw new Error("No phone number provided");

    const oneTimeAuthCode = crypto.randomDigits(6).join('');
    await sendSMS(userPhoneNumber, oneTimeAuthCode, event.userName);

    event.response.privateChallengeParameters = {otp: oneTimeAuthCode};
    return event;
}
