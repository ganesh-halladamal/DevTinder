const express = require('express');
const { body, query } = require('express-validator');
const notificationController = require('../controllers/notifications');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const paginationValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('unreadOnly').optional().isBoolean()
];

const createNotificationValidation = [
  body('recipient').isMongoId().withMessage('Valid recipient ID is required'),
  body('type').isIn(['match', 'message', 'like', 'superlike', 'project_invite', 'system']).withMessage('Valid notification type is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('data.conversationId').optional().isMongoId(),
  body('data.messageId').optional().isMongoId(),
  body('data.matchId').optional().isMongoId(),
  body('data.projectId').optional().isMongoId(),
  body('data.actionUrl').optional().isURL()
];

// Notification routes
router.get('/', auth, paginationValidation, notificationController.getNotifications);
router.get('/unread-count', auth, notificationController.getUnreadCount);
router.post('/', auth, createNotificationValidation, notificationController.createNotification);
router.put('/:notificationId/read', auth, notificationController.markAsRead);
router.put('/read-all', auth, notificationController.markAllAsRead);
router.delete('/:notificationId', auth, notificationController.deleteNotification);

module.exports = router;