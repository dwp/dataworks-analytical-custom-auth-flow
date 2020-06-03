const digitGenerator = require('crypto-secure-random-digit');

/*** Wraps the provided function to suppresses all error details from reaching the user
 and logs the errors, while providing an errorId to the user for correlation*/
module.exports = function handleErrorsWrapper(func, ...params){
    try {
        return func(...params)
    } catch (e) {
        /* Generate random error ID */
        e.correlationId = Buffer.from(digitGenerator.randomDigits(32).join('')).toString('base64');
        console.error(JSON.stringify(e));
        throw new Error(`Error occurred while processing your request. Please try again later or contact support (errorId: ${e.correlationId})`)
    }
}
