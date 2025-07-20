const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('🔍 Validation errors:', errors.array());
        console.log('🔍 Request body:', req.body);
        console.log('🔍 Validation failed for fields:', errors.array().map(e => e.path));
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
    body('phoneNumber')  // Changed from phone_number to match frontend
        .optional()
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Phone number must be less than 255 characters'),
    body('campaign')  // Changed from campaign_id to match frontend
        .optional()
        .custom((value) => {
            if (value === '' || value === null || value === undefined) return true;
            // Check if it's a valid UUID
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            return uuidRegex.test(value);
        })
        .withMessage('Campaign must be a valid UUID'),
    body('listed')
        .optional()
        .custom((value) => {
            if (value === '' || value === null || value === undefined) return true;
            return ['listed_with_realtor', 'listed_by_owner', 'not_listed'].includes(value);
        })
        .withMessage('Listed must be one of: listed_with_realtor, listed_by_owner, not_listed'),
    body('ap')
        .optional()
        .custom((value) => {
            if (value === '' || value === null || value === undefined) return true;
            const num = parseFloat(value);
            return !isNaN(num) && num >= 0;
        })
        .withMessage('AP must be a positive number'),
    body('mv')
        .optional()
        .custom((value) => {
            if (value === '' || value === null || value === undefined) return true;
            const num = parseFloat(value);
            return !isNaN(num) && num >= 0;
        })
        .withMessage('MV must be a positive number'),
    body('repairsNeeded')  // Changed from repairs_needed to match frontend
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Repairs needed must be less than 1000 characters'),
    body('bedrooms')
        .optional()
        .custom((value) => {
            if (value === '' || value === null || value === undefined) return true;
            if (value === '6+') return true;  // Allow 6+ as valid
            const num = parseInt(value);
            if (isNaN(num)) return false;
            return num >= 1 && num <= 10;
        })
        .withMessage('Bedrooms must be between 1 and 10, or 6+'),
    body('bathrooms')
        .optional()
        .custom((value) => {
            if (value === '' || value === null || value === undefined) return true;
            if (value === '4+') return true;  // Allow 4+ as valid
            const num = parseFloat(value);
            if (isNaN(num)) return false;
            return num >= 0.5 && num <= 10;
        })
        .withMessage('Bathrooms must be between 0.5 and 10, or 4+'),
    body('condition')  // Changed from condition_rating to match frontend
        .optional()
        .custom((value) => {
            if (value === '' || value === null || value === undefined) return true;
            const num = parseInt(value);
            if (isNaN(num)) return false;
            return num >= 1 && num <= 10;
        })
        .withMessage('Condition rating must be between 1 and 10'),
    body('occupancy')
        .optional()
        .custom((value) => {
            if (value === '' || value === null || value === undefined) return true;
            return ['owner_occupied', 'tenants', 'vacant'].includes(value);
        })
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
    body('additionalInfo')  // Changed from additional_info to match frontend
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