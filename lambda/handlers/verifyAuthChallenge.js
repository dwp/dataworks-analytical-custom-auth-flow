export default async function verifyAuthChallenge(event) {
    const oneTimeAuthCode = event.request.privateChallengeParameters.otp;
    event.response.answerCorrect = event.request.challengeAnswer === oneTimeAuthCode;
    return event;
}
