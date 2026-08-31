const Joi = require('joi');

const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.details.map(d => d.message),
            });
        }
        next();
    };
};

const schemas = {
    register: Joi.object({
        username: Joi.string().min(3).max(30).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        ).required(),
    }),
    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    }),
    licenseValidate: Joi.object({
        license_key: Joi.string().pattern(/^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/).required(),
        hwid: Joi.string().required(),
    }),
    licenseGenerate: Joi.object({
        duration: Joi.number().integer().min(1).max(365).default(365),
        maxActivations: Joi.number().integer().min(1).max(10).default(1),
    }),
};

module.exports = { validate, schemas };