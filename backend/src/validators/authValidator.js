const Joi = require('joi');

const authValidator = {
  signup: Joi.object({
    mobile: Joi.string().pattern(/^[0-9]{10,15}$/).required().messages({
      'string.pattern.base': 'Mobile number must be 10-15 digits'
    }),
    farmer_id: Joi.string().required(),
    otp: Joi.string().length(6).required()
  }),

  login: Joi.object({
    mobile: Joi.string().pattern(/^[0-9]{10,15}$/).required(),
    password: Joi.string().required()
  }),
  
  sendOtp: Joi.object({
     mobile: Joi.string().pattern(/^[0-9]{10,15}$/).required()
  }),
  
  verifyOtp: Joi.object({
      mobile: Joi.string().pattern(/^[0-9]{10,15}$/).required(),
      otp: Joi.string().length(4).required()
  })
};

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

module.exports = { authValidator, validate };
