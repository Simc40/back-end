function CustomException(message, errorCode) {
    const error = new Error(message);
  
    error.code = errorCode;
    return error;
}
  
CustomException.prototype = Object.create(Error.prototype);

module.exports = {CustomException}