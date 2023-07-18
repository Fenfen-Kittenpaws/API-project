// backend/utils/validation.js
const { validationResult } = require('express-validator');

// middleware for formatting errors from express-validator middleware
// (to customize, see express-validator's documentation)
const handleValidationErrors = (req, res, next) => {
  const validationErrors = validationResult(req);

  if (!validationErrors.isEmpty()) {
    const errors = validationErrors.array().reduce((acc, error) => {
      acc[error.param] = error.msg;
      return acc;
    }, {});

    return res.status(400).json({
      message: 'Bad Request',
      errors: {
        credential: "Email or username is required",
        password: "Password is required"
      }
    });
  }

  next();
};

module.exports = {
  handleValidationErrors
};
