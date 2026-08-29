const responseHelper = {
  success: (res, message, data = null, statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  },

  error: (res, message, error = null, statusCode = 500) => {
    return res.status(statusCode).json({
      success: false,
      message,
      error
    });
  },

  notFound: (res, message = 'Resource not found') => {
    return responseHelper.error(res, message, null, 404);
  },

  badRequest: (res, message = 'Bad request', error = null) => {
    return responseHelper.error(res, message, error, 400);
  },
  
  unauthorized: (res, message = 'Unauthorized access') => {
    return responseHelper.error(res, message, null, 401);
  }
};

module.exports = responseHelper;
