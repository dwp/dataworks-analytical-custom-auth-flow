import defineAuthChallenge from "./handlers/defineAuthChallenge";
import createAuthChallenge from "./handlers/createAuthChallenge";
import verifyAuthChallenge from "./handlers/verifyAuthChallenge";
import preTokenGeneration from "./handlers/preTokenGeneration";
import preAuth from "./handlers/preAuth";
import postAuth from "./handlers/postAuth";

module.exports = {
    defineAuthChallenge,
    createAuthChallenge,
    verifyAuthChallenge,
    preTokenGeneration,
    preAuth,
    postAuth,
};
