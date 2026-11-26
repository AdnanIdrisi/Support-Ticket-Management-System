const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const getNotifications = asyncHandler(async (req, res) => {
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ recipient: req.user._id })
      .populate('ticket', 'ticketNumber title status')
      .sort({ createdAt: -1 })
      .limit(30),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      notifications,
      unreadCount,
    },
  });
});

const markNotificationRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    return next(new AppError('Notification not found.', 404));
  }

  res.status(200).json({
    success: true,
    data: { notification },
  });
});

const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
  });
});

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
