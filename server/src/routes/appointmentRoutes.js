const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const optionalAuth = require('../middleware/optionalAuth');
const auth = require('../middleware/auth');

// @route   POST api/appointments
// @desc    Book an appointment
// @access  Public (Guest or Patient)
router.post('/', optionalAuth, appointmentController.bookAppointment);

// @route   GET api/appointments/me
// @desc    Get my appointments (Patient)
// @access  Private
router.get('/me', auth, appointmentController.getMyAppointments);

// @route   GET api/appointments/doctor
// @desc    Get doctor's appointments
// @access  Private (Doctor)
router.get('/doctor', auth, appointmentController.getDoctorAppointments);

// @route   PATCH api/appointments/:id/status
// @desc    Update appointment status
// @access  Private (Doctor)
router.patch('/:id/status', auth, appointmentController.updateAppointmentStatus);

module.exports = router;
