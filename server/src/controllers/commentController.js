const Ticket = require('../models/Ticket');
const Comment = require('../models/Comment');
const asyncHandler = require('../utils/asyncHandler');
const { ensureTicketAccess } = require('./ticketController');
const { ticketEvents, EVENTS } = require('../events/ticketEvents');

const addComment = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  ensureTicketAccess(ticket, req.user);

  const comment = await Comment.create({
    ticket: ticket._id,
    author: req.user._id,
    body: req.body.body,
  });

  await comment.populate('author', 'name email role');
  ticketEvents.emit(EVENTS.COMMENT_ADDED, { ticket, comment, actor: req.user });

  res.status(201).json({
    success: true,
    message: 'Comment added successfully',
    data: { comment },
  });
});

const getComments = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  ensureTicketAccess(ticket, req.user);

  const comments = await Comment.find({ ticket: ticket._id })
    .populate('author', 'name email role')
    .sort({ createdAt: 1 });

  res.status(200).json({
    success: true,
    data: { comments },
  });
});

module.exports = { addComment, getComments };
