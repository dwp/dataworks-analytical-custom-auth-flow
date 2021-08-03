module.exports.getUserDetails = async function (userPoolId,userName){
    if(userName == "noMfa"){
        return {PreferredMfaSetting: null}
    }
    if(userName == "unknown") {
        throw 'User unknown'
    }
    return {PreferredMfaSetting: "SOFTWARE_TOKEN_MFA"}
}
