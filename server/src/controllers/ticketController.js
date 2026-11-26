const Ticket = require('../models/Ticket');
const Comment = require('../models/Comment');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { ticketEvents, EVENTS } = require('../events/ticketEvents');

const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'priority', 'status', 'title'];

const ensureTicketAccess = (ticket, user) => {
  if (!ticket) {
    throw new AppError('Ticket not found.', 404);
  }
  const ownerId = ticket.createdBy._id || ticket.createdBy;
  if (user.role !== 'admin' && String(ownerId) !== String(user._id)) {
    throw new AppError('You do not have permission to access this ticket.', 403);
  }
};

const createTicket = asyncHandler(async (req, res) => {
  const { title, description, category, priority } = req.body;

  const ticket = await Ticket.create({
    title,
    description,
    category,
    priority,
    createdBy: req.user._id,
  });

  await ticket.populate('createdBy', 'name email role');
  ticketEvents.emit(EVENTS.TICKET_CREATED, { ticket, actor: req.user });

  res.status(201).json({
    success: true,
    message: 'Support ticket created successfully',
    data: { ticket },
  });
});

const getTickets = asyncHandler(async (req, res) => {
  const {
    search,
    status,
    priority,
    category,
    sortBy = 'createdAt',
    order = 'desc',
    page = 1,
    limit = 10,
  } = req.query;

  const filter = {};
  if (req.user.role !== 'admin') {
    filter.createdBy = req.user._id;
  } else if (req.query.createdBy) {
    filter.createdBy = req.query.createdBy;
  }

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;

  if (search && search.trim()) {
    const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ title: regex }, { description: regex }, { ticketNumber: regex }];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const sortField = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
  const sortOrder = order === 'asc' ? 1 : -1;

  const [tickets, total] = await Promise.all([
    Ticket.find(filter)
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .sort({ [sortField]: sortOrder })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Ticket.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      tickets,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    },
  });
});

const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id)
    .populate('createdBy', 'name email role')
    .populate('assignedTo', 'name email role');

  ensureTicketAccess(ticket, req.user);

  const [comments, activityLogs] = await Promise.all([
    Comment.find({ ticket: ticket._id })
      .populate('author', 'name email role')
      .sort({ createdAt: 1 }),
    ActivityLog.find({ ticket: ticket._id })
      .populate('actor', 'name email role')
      .sort({ createdAt: -1 }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      ticket,
      comments,
      activityLogs,
    },
  });
});

const updateTicket = asyncHandler(async (req, res, next) => {
  const ticket = await Ticket.findById(req.params.id);
  ensureTicketAccess(ticket, req.user);

  if (req.user.role !== 'admin' && ['resolved', 'closed'].includes(ticket.status)) {
    return next(
      new AppError('Resolved or closed tickets cannot be edited by the submitter.', 400)
    );
  }

  const allowedFields = ['title', 'description', 'category', 'priority'];
  const changes = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined && req.body[field] !== ticket[field]) {
      changes[field] = { from: ticket[field], to: req.body[field] };
      ticket[field] = req.body[field];
    }
  });

  await ticket.save();
  await ticket.populate('createdBy', 'name email role');
  await ticket.populate('assignedTo', 'name email role');

  if (Object.keys(changes).length > 0) {
    ticketEvents.emit(EVENTS.TICKET_UPDATED, { ticket, actor: req.user, changes });
  }

  res.status(200).json({
    success: true,
    message: 'Ticket updated successfully',
    data: { ticket },
  });
});

const deleteTicket = asyncHandler(async (req, res, next) => {
  const ticket = await Ticket.findById(req.params.id);
  ensureTicketAccess(ticket, req.user);

  if (req.user.role !== 'admin' && ticket.status !== 'open') {
    return next(
      new AppError('Only open tickets can be deleted by the submitter.', 400)
    );
  }

  await Promise.all([
    Comment.deleteMany({ ticket: ticket._id }),
    ActivityLog.deleteMany({ ticket: ticket._id }),
    Notification.deleteMany({ ticket: ticket._id }),
    ticket.deleteOne(),
  ]);

  res.status(200).json({
    success: true,
    message: 'Ticket deleted successfully',
  });
});

const getMyTicketStats = asyncHandler(async (req, res) => {
  const matchStage =
    req.user.role === 'admin' ? {} : { createdBy: req.user._id };

  const [statusCounts, priorityCounts, totalTickets] = await Promise.all([
    Ticket.aggregate([
      { $match: matchStage },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Ticket.aggregate([
      { $match: matchStage },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),
    Ticket.countDocuments(matchStage),
  ]);

  const byStatus = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
  statusCounts.forEach((item) => {
    byStatus[item._id] = item.count;
  });

  const byPriority = { low: 0, medium: 0, high: 0, urgent: 0 };
  priorityCounts.forEach((item) => {
    byPriority[item._id] = item.count;
  });

  res.status(200).json({
    success: true,
    data: {
      totalTickets,
      byStatus,
      byPriority,
    },
  });
});

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  getMyTicketStats,
  ensureTicketAccess,
};
