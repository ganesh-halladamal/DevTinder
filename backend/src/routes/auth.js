const express = require('express');
const { body } = require('express-validator');
const passport = require('passport');
const authController = require('../controllers/auth');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const registerValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('name').notEmpty().withMessage('Name is required'),
  body('avatar').optional().isString(),
  body('projects').optional().isArray(),
  body('projects.*.title').optional().isString().notEmpty().withMessage('Project title cannot be empty'),
  body('projects.*.description').optional().isString(),
  body('projects.*.techStack').optional().isArray(),
  body('projects.*.techStack.*').optional().isString(),
  body('projects.*.repoUrl').optional({ nullable: true }).isString(),
  body('projects.*.liveUrl').optional({ nullable: true }).isString(),
  body('projects.*.images').optional().isArray(),
  body('projects.*.images.*').optional().isString()
];

const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const passwordResetValidation = [
  body('email').isEmail().withMessage('Please enter a valid email')
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

const resendVerificationValidation = [
  body('email').isEmail().withMessage('Please enter a valid email')
];

// Auth routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.get('/me', auth, authController.getCurrentUser);
router.post('/logout', auth, authController.logout);

// Password reset routes
router.post('/forgot-password', passwordResetValidation, authController.requestPasswordReset);
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);

// Email verification routes
router.get('/verify/:token', authController.verifyEmail);
router.post('/resend-verification', resendVerificationValidation, authController.resendVerification);

// GitHub OAuth routes
router.get('/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

router.get('/github/callback',
  passport.authenticate('github', { session: false }),
  authController.githubCallback
);

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  authController.googleCallback
);

module.exports = router; 