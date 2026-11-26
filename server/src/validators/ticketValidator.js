const { z } = require('zod');
const {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} = require('../models/Ticket');

const createTicketSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(150, 'Title cannot exceed 150 characters'),
  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description cannot exceed 5000 characters'),
  category: z.enum(TICKET_CATEGORIES).optional().default('technical'),
  priority: z.enum(TICKET_PRIORITIES).optional().default('medium'),
});

const updateTicketSchema = z
  .object({
    title: z.string().trim().min(3).max(150).optional(),
    description: z.string().trim().min(10).max(5000).optional(),
    category: z.enum(TICKET_CATEGORIES).optional(),
    priority: z.enum(TICKET_PRIORITIES).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  });

const adminUpdateTicketSchema = z
  .object({
    status: z.enum(TICKET_STATUSES).optional(),
    priority: z.enum(TICKET_PRIORITIES).optional(),
    assignedTo: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field (status, priority, or assignedTo) must be provided',
  });

const createCommentSchema = z.object({
  body: z
    .string({ required_error: 'Comment body is required' })
    .trim()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment cannot exceed 2000 characters'),
});

module.exports = {
  createTicketSchema,
  updateTicketSchema,
  adminUpdateTicketSchema,
  createCommentSchema,
};
