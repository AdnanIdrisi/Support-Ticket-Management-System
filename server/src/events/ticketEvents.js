const EventEmitter = require('events');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');

class TicketEventBus extends EventEmitter {}

const ticketEvents = new TicketEventBus();

const EVENTS = {
  TICKET_CREATED: 'ticket.created',
  TICKET_UPDATED: 'ticket.updated',
  STATUS_CHANGED: 'ticket.status_changed',
  COMMENT_ADDED: 'comment.added',
  TICKET_RESOLVED: 'ticket.resolved',
};

const safeHandle = (handler) => async (payload) => {
  try {
    await handler(payload);
  } catch (err) {
    console.error('[TicketEventBus] Listener error:', err.message);
  }
};

// 1. Ticket Created -> Log activity, notify admins, send confirmation email to creator
ticketEvents.on(
  EVENTS.TICKET_CREATED,
  safeHandle(async ({ ticket, actor }) => {
    await ActivityLog.create({
      ticket: ticket._id,
      actor: actor._id,
      event: EVENTS.TICKET_CREATED,
      description: `Ticket ${ticket.ticketNumber} created by ${actor.name}`,
      metadata: { title: ticket.title, priority: ticket.priority, category: ticket.category },
    });

    const admins = await User.find({ role: 'admin', isActive: true }).select('_id email name');
    if (admins.length > 0) {
      await Notification.insertMany(
        admins.map((admin) => ({
          recipient: admin._id,
          ticket: ticket._id,
          event: EVENTS.TICKET_CREATED,
          message: `New ${ticket.priority} priority ticket ${ticket.ticketNumber}: "${ticket.title}"`,
        }))
      );
    }

    await sendEmail({
      to: actor.email,
      subject: `[${ticket.ticketNumber}] Support Ticket Received`,
      text: `Hi ${actor.name},\n\nYour support ticket "${ticket.title}" (${ticket.ticketNumber}) has been created with priority "${ticket.priority}". Our team will review it shortly.`,
    });
  })
);

// 2. Ticket Updated -> Log activity
ticketEvents.on(
  EVENTS.TICKET_UPDATED,
  safeHandle(async ({ ticket, actor, changes }) => {
    await ActivityLog.create({
      ticket: ticket._id,
      actor: actor._id,
      event: EVENTS.TICKET_UPDATED,
      description: `Ticket ${ticket.ticketNumber} details updated by ${actor.name}`,
      metadata: { changes },
    });
  })
);

// 3. Status Changed -> Log activity, notify ticket owner, send email
ticketEvents.on(
  EVENTS.STATUS_CHANGED,
  safeHandle(async ({ ticket, actor, previousStatus, newStatus }) => {
    await ActivityLog.create({
      ticket: ticket._id,
      actor: actor._id,
      event: EVENTS.STATUS_CHANGED,
      description: `Status changed from "${previousStatus}" to "${newStatus}" by ${actor.name}`,
      metadata: { previousStatus, newStatus },
    });

    const ownerId = ticket.createdBy._id || ticket.createdBy;
    if (String(ownerId) !== String(actor._id)) {
      await Notification.create({
        recipient: ownerId,
        ticket: ticket._id,
        event: EVENTS.STATUS_CHANGED,
        message: `Ticket ${ticket.ticketNumber} status updated to "${newStatus.replace('_', ' ')}"`,
      });

      const owner = await User.findById(ownerId).select('email name');
      if (owner) {
        await sendEmail({
          to: owner.email,
          subject: `[${ticket.ticketNumber}] Status Updated to ${newStatus}`,
          text: `Hi ${owner.name},\n\nThe status of your ticket "${ticket.title}" (${ticket.ticketNumber}) was updated from "${previousStatus}" to "${newStatus}".`,
        });
      }
    }
  })
);

// 4. Comment Added -> Log activity, notify the other party, send email
ticketEvents.on(
  EVENTS.COMMENT_ADDED,
  safeHandle(async ({ ticket, comment, actor }) => {
    await ActivityLog.create({
      ticket: ticket._id,
      actor: actor._id,
      event: EVENTS.COMMENT_ADDED,
      description: `${actor.name} (${actor.role}) commented on ${ticket.ticketNumber}`,
      metadata: { commentId: comment._id },
    });

    const ownerId = ticket.createdBy._id || ticket.createdBy;
    if (actor.role === 'admin' && String(ownerId) !== String(actor._id)) {
      await Notification.create({
        recipient: ownerId,
        ticket: ticket._id,
        event: EVENTS.COMMENT_ADDED,
        message: `Admin ${actor.name} replied on ticket ${ticket.ticketNumber}`,
      });

      const owner = await User.findById(ownerId).select('email name');
      if (owner) {
        await sendEmail({
          to: owner.email,
          subject: `[${ticket.ticketNumber}] New Reply from Support`,
          text: `Hi ${owner.name},\n\n${actor.name} replied to your ticket "${ticket.title}":\n\n"${comment.body}"`,
        });
      }
    } else if (actor.role === 'user') {
      const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
      if (admins.length > 0) {
        await Notification.insertMany(
          admins.map((admin) => ({
            recipient: admin._id,
            ticket: ticket._id,
            event: EVENTS.COMMENT_ADDED,
            message: `${actor.name} commented on ticket ${ticket.ticketNumber}`,
          }))
        );
      }
    }
  })
);

// 5. Ticket Resolved -> Log resolution event, notify ticket owner, send email
ticketEvents.on(
  EVENTS.TICKET_RESOLVED,
  safeHandle(async ({ ticket, actor }) => {
    await ActivityLog.create({
      ticket: ticket._id,
      actor: actor._id,
      event: EVENTS.TICKET_RESOLVED,
      description: `Ticket ${ticket.ticketNumber} marked as resolved by ${actor.name}`,
      metadata: { resolvedAt: ticket.resolvedAt },
    });

    const ownerId = ticket.createdBy._id || ticket.createdBy;
    if (String(ownerId) !== String(actor._id)) {
      await Notification.create({
        recipient: ownerId,
        ticket: ticket._id,
        event: EVENTS.TICKET_RESOLVED,
        message: `Your ticket ${ticket.ticketNumber} has been resolved!`,
      });

      const owner = await User.findById(ownerId).select('email name');
      if (owner) {
        await sendEmail({
          to: owner.email,
          subject: `[${ticket.ticketNumber}] Ticket Resolved`,
          text: `Hi ${owner.name},\n\nYour support ticket "${ticket.title}" (${ticket.ticketNumber}) has been marked as resolved.`,
        });
      }
    }
  })
);

module.exports = { ticketEvents, EVENTS };
