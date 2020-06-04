const digitGenerator = require('crypto-secure-random-digit');

/*** Used when the thrown error should reach the user */
class UserExposedError extends Error {
    constructor(message) {
        super(message);
        this.name = "UserExposedError";
    }
}

/*** Wraps the provided function to suppress all error details from reaching the user
 and logs the errors, while providing an errorId to the user for correlation*/
async function handleErrorsWrapper(func, ...params){
    try {
        return await func(...params);
    } catch (e) {
        if(e instanceof UserExposedError){
            throw e;
        }
        /* Generate random error ID */
        e.correlationId = Buffer.from(digitGenerator.randomDigits(32).join('')).toString('base64');
        console.error(JSON.stringify(e, Object.getOwnPropertyNames(e)));
        throw new Error(`Error occurred while processing your request. Please try again later or contact support (errorId: ${e.correlationId})`);
    }
}

module.exports = {
    handleErrorsWrapper,
    UserExposedError
}
