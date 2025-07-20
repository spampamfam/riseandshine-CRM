const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('🔍 Validation errors:', errors.array());
        return res.status(400).json({ 
            error: 'Validation failed', 
            details: errors.array() 
        });
    }
    next();
};

const validateRegistration = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Name is required and must be less than 255 characters'),
    body('nationalId')
        .trim()
        .isLength({ min: 5, max: 50 })
        .withMessage('National ID is required and must be between 5-50 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    body('phoneNumber')
        .trim()
        .isLength({ min: 10, max: 20 })
        .withMessage('Phone number is required and must be between 10-20 characters'),
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
        .optional()
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Name must be less than 255 characters'),
    body('phone_number')
        .optional()
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Phone number must be less than 255 characters'),
    body('campaign_id')
        .optional()
        .isUUID()
        .withMessage('Campaign ID must be a valid UUID'),
    body('listed')
        .optional()
        .isIn(['listed_with_realtor', 'listed_by_owner', 'not_listed'])
        .withMessage('Listed must be one of: listed_with_realtor, listed_by_owner, not_listed'),
    body('ap')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('AP must be a positive number'),
    body('mv')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('MV must be a positive number'),
    body('repairs_needed')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Repairs needed must be less than 1000 characters'),
    body('bedrooms')
        .optional()
        .isInt({ min: 1, max: 10 })
        .withMessage('Bedrooms must be between 1 and 10'),
    body('bathrooms')
        .optional()
        .isFloat({ min: 0.5, max: 10 })
        .withMessage('Bathrooms must be between 0.5 and 10'),
    body('condition_rating')
        .optional()
        .isInt({ min: 1, max: 10 })
        .withMessage('Condition rating must be between 1 and 10'),
    body('occupancy')
        .optional()
        .isIn(['owner_occupied', 'tenants', 'vacant'])
        .withMessage('Occupancy must be one of: owner_occupied, tenants, vacant'),
    body('reason')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Reason must be less than 500 characters'),
    body('closing')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Closing must be less than 100 characters'),
    body('address')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Address must be less than 500 characters'),
    body('additional_info')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Additional info must be less than 1000 characters'),
    handleValidationErrors
];

module.exports = {
    validateRegistration,
    validateLogin,
    validateLead,
    handleValidationErrors
}; 