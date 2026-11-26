const mongoose = require('mongoose');
const crypto = require('crypto');

const TICKET_CATEGORIES = [
  'technical',
  'billing',
  'account',
  'feature_request',
  'bug',
  'other',
];

const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const TICKET_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    category: {
      type: String,
      enum: TICKET_CATEGORIES,
      default: 'technical',
    },
    priority: {
      type: String,
      enum: TICKET_PRIORITIES,
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: TICKET_STATUSES,
      default: 'open',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

ticketSchema.index({ createdBy: 1, status: 1, createdAt: -1 });
ticketSchema.index({ status: 1, priority: 1, createdAt: -1 });
ticketSchema.index({ title: 'text', description: 'text', ticketNumber: 'text' });

ticketSchema.pre('validate', function generateTicketNumber(next) {
  if (!this.ticketNumber) {
    const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.ticketNumber = `TKT-${suffix}`;
  }
  next();
});

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
module.exports.TICKET_CATEGORIES = TICKET_CATEGORIES;
module.exports.TICKET_PRIORITIES = TICKET_PRIORITIES;
module.exports.TICKET_STATUSES = TICKET_STATUSES;
