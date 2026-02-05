const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const auth = require('../middleware/auth');

// @route   GET api/patients/me
// @desc    Get current patient profile
// @access  Private
router.get('/me', auth, patientController.getPatientProfile);

// @route   GET api/patients/me/history
// @desc    Get current patient medical history (EMR)
// @access  Private
router.get('/me/history', auth, patientController.getMyHistory);

// @route   PUT api/patients/me
// @desc    Update current patient profile
// @access  Private
router.put('/me', auth, patientController.updateMyProfile);

// @route   POST api/patients
// @desc    Create or update patient profile
// @access  Private
router.post('/', auth, patientController.createOrUpdateProfile);

module.exports = router;
