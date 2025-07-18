const express = require('express');
const { body } = require('express-validator');
const matchController = require('../controllers/matches');
const auth = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const matchValidation = [
  body('userId').isMongoId().withMessage('Invalid user ID')
];

const statusValidation = [
  body('status')
    .isIn(['active', 'archived', 'blocked'])
    .withMessage('Invalid status')
];

// Match routes
router.get('/', auth, matchController.getMatches);
router.post('/', auth, matchValidation, matchController.createMatch);
router.get('/:matchId', auth, matchController.getMatchDetails);
router.put('/:matchId/status', auth, statusValidation, matchController.updateMatchStatus);

module.exports = router; 