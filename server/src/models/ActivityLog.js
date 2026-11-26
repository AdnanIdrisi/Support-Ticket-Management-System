const mongoose = require('mongoose');

const ACTIVITY_EVENTS = [
  'ticket.created',
  'ticket.updated',
  'ticket.status_changed',
  'comment.added',
  'ticket.resolved',
];

const activityLogSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    event: {
      type: String,
      enum: ACTIVITY_EVENTS,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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

activityLogSchema.index({ ticket: 1, createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
module.exports.ACTIVITY_EVENTS = ACTIVITY_EVENTS;
