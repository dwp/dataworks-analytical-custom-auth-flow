const defineAuthChallenge = require("./handlers/defineAuthChallenge");
const createAuthChallenge = require("./handlers/createAuthChallenge");
const verifyAuthChallenge = require("./handlers/verifyAuthChallenge");
const preTokenGeneration = require("./handlers/preTokenGeneration");
const preAuth = require("./handlers/preAuth");
const postAuth = require("./handlers/postAuth");

const {handleErrorsWrapper} = require("./errors");

module.exports = {
    defineAuthChallenge: (event, context) => handleErrorsWrapper(defineAuthChallenge, event, context),
    createAuthChallenge: (event, context) => handleErrorsWrapper(createAuthChallenge, event, context),
    verifyAuthChallenge: (event, context) => handleErrorsWrapper(verifyAuthChallenge, event, context),
    preTokenGeneration: (event, context) => handleErrorsWrapper(preTokenGeneration, event, context),
    preAuth: (event, context) => handleErrorsWrapper(preAuth, event, context),
    postAuth: (event, context) => handleErrorsWrapper(postAuth, event, context),
};
