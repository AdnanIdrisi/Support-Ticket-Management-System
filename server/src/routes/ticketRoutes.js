const express = require('express');
const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  getMyTicketStats,
} = require('../controllers/ticketController');
const { addComment, getComments } = require('../controllers/commentController');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
  createTicketSchema,
  updateTicketSchema,
  createCommentSchema,
} = require('../validators/ticketValidator');

const router = express.Router();

router.use(protect);

router.get('/stats', getMyTicketStats);

router
  .route('/')
  .post(validate(createTicketSchema), createTicket)
  .get(getTickets);

router
  .route('/:id')
  .get(getTicketById)
  .patch(validate(updateTicketSchema), updateTicket)
  .delete(deleteTicket);

router
  .route('/:id/comments')
  .get(getComments)
  .post(validate(createCommentSchema), addComment);

module.exports = router;
