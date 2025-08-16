const express = require('express');
const { body, query } = require('express-validator');
const messageController = require('../controllers/messages');
const { auth } = require('../middleware/auth');
const { canAccessConversation, areUsersMatched } = require('../middleware/authorization');

const router = express.Router();

// Validation middleware
const messageValidation = [
  body('text').notEmpty().withMessage('Message text is required'),
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
router.get('/conversations', auth, messageController.getConversations);
router.get('/conversation/:userId', auth, areUsersMatched, messageController.getOrCreateConversation);
router.get('/:conversationId', auth, canAccessConversation, paginationValidation, messageController.getMessages);
router.get('/:conversationId/preview', auth, canAccessConversation, messageController.getMessagePreview);
router.post('/:conversationId', auth, canAccessConversation, messageValidation, messageController.sendMessage);
router.post('/:conversationId/read', auth, canAccessConversation, messageController.markAsRead);
router.get('/unread/counts', auth, messageController.getUnreadCounts);
router.delete('/:messageId', auth, messageController.deleteMessage);

module.exports = router;