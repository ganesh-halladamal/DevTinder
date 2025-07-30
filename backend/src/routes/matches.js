const express = require('express');
const router = express.Router();
const { createMatch, swipeUser, getMatches } = require('../controllers/matches');
const auth = require('../middleware/auth');

// Create a new match
router.post('/', auth, createMatch);

// Handle swipe actions (like/skip)
router.post('/swipe', auth, swipeUser);

// Get all matches for current user
router.get('/', auth, getMatches);

module.exports = router;