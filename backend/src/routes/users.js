const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/users');
const auth = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const profileValidation = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('bio').optional().isString(),
  body('location').optional().isString(),
  body('avatar').optional().isString(),
  body('skills').optional().isArray(),
  body('skills.*.name').optional().isString(),
  body('skills.*.proficiency').optional().isIn(['beginner', 'intermediate', 'advanced', 'expert']),
  body('projects').optional().isArray(),
  body('projects.*.title').optional().isString().notEmpty().withMessage('Project title cannot be empty'),
  body('projects.*.description').optional().isString(),
  body('projects.*.techStack').optional().isArray(),
  body('projects.*.techStack.*').optional().isString(),
  // Make URL validations conditional so they only validate if the field exists and is not null/empty
  body('projects.*.repoUrl')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (!value) return true;
      return /^https?:\/\/\S+$/.test(value) || value === '';
    })
    .withMessage('Repository URL must be a valid URL or empty'),
  body('projects.*.liveUrl')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (!value) return true;
      return /^https?:\/\/\S+$/.test(value) || value === '';
    })
    .withMessage('Live URL must be a valid URL or empty'),
  body('interests').optional().isArray(),
  body('interests.*').isString(),
  body('socialLinks').optional().isObject(),
  body('socialLinks.github')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (!value) return true;
      return /^https?:\/\/\S+$/.test(value) || value === '';
    }),
  body('socialLinks.linkedin')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (!value) return true;
      return /^https?:\/\/\S+$/.test(value) || value === '';
    }),
  body('socialLinks.twitter')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (!value) return true;
      return /^https?:\/\/\S+$/.test(value) || value === '';
    }),
  body('socialLinks.portfolio')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (!value) return true;
      return /^https?:\/\/\S+$/.test(value) || value === '';
    }),
];

// Profile routes
router.get('/profile/:id', auth, userController.getProfile);
router.put('/profile', auth, profileValidation, userController.updateProfile);

// Serve static files from the uploads directory
router.use('/uploads', express.static('uploads'));

// Get all users (basic listing)
router.get('/', auth, userController.getAllUsers);

// Search routes
router.get('/search', auth, userController.searchUsers);

// Matching routes
router.get('/matches/potential', auth, userController.getPotentialMatches);
router.post('/matches/like/:id', auth, userController.likeUser);
router.post('/matches/dislike/:id', auth, userController.dislikeUser);

module.exports = router;