const express = require('express');
const { body, query } = require('express-validator');
const messageController = require('../controllers/messages');
const auth = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const messageValidation = [
  body('content').notEmpty().withMessage('Message content is required'),
  body('attachments').optional().isArray(),
  body('attachments.*.type').optional().isIn(['image', 'link', 'code']),
  body('attachments.*.url').optional().isURL(),
  body('attachments.*.preview').optional().isString(),
  body('attachments.*.language').optional().isString()
];

const paginationValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
];

// Message routes
router.get('/:matchId', auth, paginationValidation, messageController.getMessages);
router.post('/:matchId', auth, messageValidation, messageController.sendMessage);
router.post('/:matchId/read', auth, messageController.markAsRead);
router.delete('/:messageId', auth, messageController.deleteMessage);

module.exports = router; 