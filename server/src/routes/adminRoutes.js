const express = require('express');
const {
  updateTicketByAdmin,
  getAdminDashboardStats,
  getUsers,
} = require('../controllers/adminController');
const { getTickets } = require('../controllers/ticketController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { adminUpdateTicketSchema } = require('../validators/ticketValidator');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/stats', getAdminDashboardStats);
router.get('/users', getUsers);
router.get('/tickets', getTickets);
router.patch('/tickets/:id', validate(adminUpdateTicketSchema), updateTicketByAdmin);

module.exports = router;
