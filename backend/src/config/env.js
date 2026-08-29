const Joi = require('joi');

const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(5000),
  
  DATABASE_HOST: Joi.string().default('localhost'),
  DATABASE_PORT: Joi.number().default(3306),
  DATABASE_NAME: Joi.string().required().description('Database name'),
  DATABASE_USER: Joi.string().required().description('Database username'),
  DATABASE_PASSWORD: Joi.string().allow('').default(''),
  
  JWT_SECRET: Joi.string().required().description('JWT Secret Key'),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  
  DATA_GOV_API_KEY: Joi.string().allow('').description('Data.gov.in API Key for Mandi prices'),
  
  SMS_PROVIDER: Joi.string().valid('mock', 'msg91', 'twilio').default('mock'),
  SMS_API_KEY: Joi.string().allow('').description('SMS Provider API Key'),
  SMS_SENDER_ID: Joi.string().allow('').description('SMS Sender ID'),
  
  FRONTEND_URL: Joi.string().default('http://localhost:5500')
}).unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  console.error(`Config validation error: ${error.message}`);
  // process.exit(1);
}

module.exports = {
  NODE_ENV: envVars.NODE_ENV,
  PORT: envVars.PORT,
  DATABASE_HOST: envVars.DATABASE_HOST,
  DATABASE_PORT: envVars.DATABASE_PORT,
  DATABASE_NAME: envVars.DATABASE_NAME,
  DATABASE_USER: envVars.DATABASE_USER,
  DATABASE_PASSWORD: envVars.DATABASE_PASSWORD,
  JWT_SECRET: envVars.JWT_SECRET,
  JWT_EXPIRES_IN: envVars.JWT_EXPIRES_IN,
  DATA_GOV_API_KEY: envVars.DATA_GOV_API_KEY,
  SMS_PROVIDER: envVars.SMS_PROVIDER,
  SMS_API_KEY: envVars.SMS_API_KEY,
  SMS_SENDER_ID: envVars.SMS_SENDER_ID,
  FRONTEND_URL: envVars.FRONTEND_URL
};
