const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
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

// Temporary project routes (to be implemented with controllers)
router.get('/', auth, (req, res) => {
  res.json({ message: 'Get all projects' });
});

router.get('/:id', auth, (req, res) => {
  res.json({ message: 'Get project by ID' });
});

router.post('/', auth, projectValidation, (req, res) => {
  res.json({ message: 'Create new project' });
});

router.put('/:id', auth, projectValidation, (req, res) => {
  res.json({ message: 'Update project' });
});

router.delete('/:id', auth, (req, res) => {
  res.json({ message: 'Delete project' });
});

module.exports = router; 