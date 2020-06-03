const defineAuthChallenge = require("./handlers/defineAuthChallenge");
const createAuthChallenge = require("./handlers/createAuthChallenge");
const verifyAuthChallenge = require("./handlers/verifyAuthChallenge");
const preTokenGeneration = require("./handlers/preTokenGeneration");
const preAuth = require("./handlers/preAuth");
const postAuth = require("./handlers/postAuth")

module.exports = {
    defineAuthChallenge,
    createAuthChallenge,
    verifyAuthChallenge,
    preTokenGeneration,
    preAuth,
    postAuth,
};
