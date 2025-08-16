const express = require('express');
const { auth } = require('../middleware/auth');
const settingsController = require('../controllers/settings');

const router = express.Router();

// Settings routes
router.get('/', auth, settingsController.getSettings);
router.put('/', auth, settingsController.updateSettings);
router.delete('/account', auth, settingsController.deleteAccount);

module.exports = router;