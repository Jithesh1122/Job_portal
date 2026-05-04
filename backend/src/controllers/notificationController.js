import Notification from '../models/Notification.js';

export const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    res.json({ notifications });
  } catch (error) {
    next(error);
  }
};

export const markNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true } },
    );

    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    next(error);
  }
};
