const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { areUsersMatched } = require('../middleware/authorization');
const matchesController = require('../controllers/matches');

// GET /matches/my-matches - Get all matches for the authenticated user
router.get('/my-matches', auth, matchesController.getMyMatches);

// GET /matches/potential - Get potential matches for the user (must come before /:matchId)
router.get('/potential', auth, matchesController.getPotentialMatches);

// POST /matches/like/:userId - Like a user
router.post('/like/:userId', auth, matchesController.likeUser);

// POST /matches/dislike/:userId - Dislike a user
router.post('/dislike/:userId', auth, matchesController.dislikeUser);

// GET /matches/:matchId - Get specific match details (must come after specific routes)
router.get('/:matchId', auth, matchesController.getMatchDetails);

// PUT /matches/:matchId/bookmark - Toggle bookmark status for a match
router.put('/:matchId/bookmark', auth, matchesController.toggleBookmark);

module.exports = router;