const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Validation failed', 
            details: errors.array() 
        });
    }
    next();
};

const validateRegistration = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    handleValidationErrors
];

const validateLogin = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    handleValidationErrors
];

const validateLead = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Name is required and must be less than 255 characters'),
    body('contact')
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Contact is required and must be less than 255 characters'),
    body('source')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Source must be less than 100 characters'),
    body('status')
        .optional()
        .isIn(['new', 'contacted', 'qualified', 'converted'])
        .withMessage('Status must be one of: new, contacted, qualified, converted'),
    handleValidationErrors
];

module.exports = {
    validateRegistration,
    validateLogin,
    validateLead,
    handleValidationErrors
}; 