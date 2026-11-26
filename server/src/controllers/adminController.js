const Ticket = require('../models/Ticket');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { ticketEvents, EVENTS } = require('../events/ticketEvents');

const updateTicketByAdmin = asyncHandler(async (req, res, next) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    return next(new AppError('Ticket not found.', 404));
  }

  const { status, priority, assignedTo } = req.body;
  const previousStatus = ticket.status;
  const changes = {};

  if (status !== undefined && status !== ticket.status) {
    changes.status = { from: ticket.status, to: status };
    ticket.status = status;
    if (status === 'resolved') {
      ticket.resolvedAt = new Date();
    } else if (previousStatus === 'resolved' && status !== 'closed') {
      ticket.resolvedAt = null;
    }
  }

  if (priority !== undefined && priority !== ticket.priority) {
    changes.priority = { from: ticket.priority, to: priority };
    ticket.priority = priority;
  }

  if (assignedTo !== undefined) {
    if (assignedTo === null || assignedTo === '') {
      ticket.assignedTo = null;
    } else {
      const assignee = await User.findById(assignedTo);
      if (!assignee || assignee.role !== 'admin') {
        return next(new AppError('Assigned user must be a valid admin.', 400));
      }
      ticket.assignedTo = assignee._id;
    }
    changes.assignedTo = ticket.assignedTo;
  }

  await ticket.save();
  await ticket.populate('createdBy', 'name email role');
  await ticket.populate('assignedTo', 'name email role');

  if (changes.status) {
    ticketEvents.emit(EVENTS.STATUS_CHANGED, {
      ticket,
      actor: req.user,
      previousStatus,
      newStatus: ticket.status,
    });
    if (ticket.status === 'resolved') {
      ticketEvents.emit(EVENTS.TICKET_RESOLVED, { ticket, actor: req.user });
    }
  } else if (Object.keys(changes).length > 0) {
    ticketEvents.emit(EVENTS.TICKET_UPDATED, { ticket, actor: req.user, changes });
  }

  res.status(200).json({
    success: true,
    message: 'Ticket updated by administrator',
    data: { ticket },
  });
});

const getAdminDashboardStats = asyncHandler(async (req, res) => {
  const [statusAgg, priorityAgg, categoryAgg, totalTickets, totalUsers, recentActivity] =
    await Promise.all([
      Ticket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Ticket.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Ticket.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      Ticket.countDocuments(),
      User.countDocuments({ role: 'user' }),
      ActivityLog.find()
        .populate('actor', 'name email role')
        .populate('ticket', 'ticketNumber title status')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

  const byStatus = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
  statusAgg.forEach((item) => {
    byStatus[item._id] = item.count;
  });

  const byPriority = { low: 0, medium: 0, high: 0, urgent: 0 };
  priorityAgg.forEach((item) => {
    byPriority[item._id] = item.count;
  });

  const byCategory = {};
  categoryAgg.forEach((item) => {
    byCategory[item._id] = item.count;
  });

  res.status(200).json({
    success: true,
    data: {
      totalTickets,
      totalUsers,
      byStatus,
      byPriority,
      byCategory,
      recentActivity,
    },
  });
});

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    data: { users },
  });
});

module.exports = {
  updateTicketByAdmin,
  getAdminDashboardStats,
  getUsers,
};
