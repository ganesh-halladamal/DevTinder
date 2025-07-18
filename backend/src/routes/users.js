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
  body('skills').optional().isArray(),
  body('skills.*.name').optional().isString(),
  body('skills.*.proficiency').optional().isIn(['beginner', 'intermediate', 'advanced', 'expert']),
  body('interests').optional().isArray(),
  body('interests.*').isString(),
  body('socialLinks').optional().isObject(),
  body('socialLinks.github').optional().isURL(),
  body('socialLinks.linkedin').optional().isURL(),
  body('socialLinks.twitter').optional().isURL(),
  body('socialLinks.portfolio').optional().isURL()
];

const projectValidation = [
  body('title').notEmpty().withMessage('Project title is required'),
  body('description').optional().isString(),
  body('techStack').optional().isArray(),
  body('techStack.*').isString(),
  body('repoUrl').optional().isURL(),
  body('liveUrl').optional().isURL(),
  body('images').optional().isArray(),
  body('images.*').isURL()
];

// Profile routes
router.get('/profile/:id', auth, userController.getProfile);
router.put('/profile', auth, profileValidation, userController.updateProfile);

// Project routes
router.post('/projects', auth, projectValidation, userController.addProject);
router.put('/projects/:projectId', auth, projectValidation, userController.updateProject);
router.delete('/projects/:projectId', auth, userController.deleteProject);

// Matching routes
router.get('/matches/potential', auth, userController.getPotentialMatches);
router.post('/matches/like/:id', auth, userController.likeUser);
router.post('/matches/dislike/:id', auth, userController.dislikeUser);

module.exports = router; 