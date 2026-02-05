const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const emrController = require('../controllers/emrController');
const { upload } = require('../middleware/uploadMiddleware');
const auth = require('../middleware/auth'); // We need to create this middleware

// @route   GET api/doctors/search
// @desc    Search doctors with filters
// @access  Public
router.get('/search', doctorController.searchDoctors);

// @route   GET api/doctors
// @desc    Get all doctors
// @access  Public
router.get('/', doctorController.getAllDoctors);

// @route   GET api/doctors/me
// @desc    Get current doctor's profile
// @access  Private
router.get('/me', auth, doctorController.getMyProfile);

// @route   GET api/doctors/me/finance
// @desc    Get current doctor's financial summary
// @access  Private
router.get('/me/finance', auth, doctorController.getDoctorFinance);

// @route   PUT api/doctors/me
// @desc    Update current doctor's profile
// @access  Private
router.put('/me', auth, doctorController.updateMyProfile);

// @route   GET api/doctors/me/patients/search
// @desc    Search patients by phone
// @access  Private
router.get('/me/patients/search', auth, doctorController.searchMyPatients);

// @route   GET api/doctors/me/patients
// @desc    Get current doctor's patients
// @access  Private
router.get('/me/patients', auth, doctorController.getMyPatients);

// @route   GET api/doctors/:id
// @desc    Get doctor by ID
// @access  Public
router.get('/:id', doctorController.getDoctorById);

// @route   GET api/doctors/:id/booked-slots
// @desc    Get all booked slots for a doctor
// @access  Public
router.get('/:id/booked-slots', doctorController.getBookedSlots);

// @route   POST api/doctors
// @desc    Create doctor profile
// @access  Private
router.post('/', auth, doctorController.createDoctorProfile);

// @route   GET api/doctors/me/patients/:patientId/profile
// @desc    Get patient profile (for EMR header)
// @access  Private (Doctor)
router.get('/me/patients/:patientId/profile', auth, emrController.getPatientProfile);

// @route   PUT api/doctors/me/patients/:patientId/profile
// @desc    Update patient profile
// @access  Private (Doctor)
router.put('/me/patients/:patientId/profile', auth, emrController.updatePatientProfile);

// @route   GET api/doctors/me/patients/:patientId/emr
// @desc    Get patient EMR history
// @access  Private (Doctor)
router.get('/me/patients/:patientId/emr', auth, emrController.getPatientHistory);

// @route   POST api/doctors/me/patients/:patientId/emr
// @desc    Create new visit/medical record
// @access  Private (Doctor)
router.post('/me/patients/:patientId/emr', auth, emrController.createVisit);

// @route   POST api/doctors/me/patients/emr/upload
// @desc    Upload medical reports/attachments
// @access  Private (Doctor)
router.post('/me/patients/emr/upload', auth, upload.array('files', 10), emrController.uploadAttachments);

// @route   PUT api/doctors/me/patients/emr/:visitId
// @desc    Update medical record/visit
// @access  Private (Doctor)
router.put('/me/patients/emr/:visitId', auth, emrController.updateVisit);

// @route   POST api/doctors/me/renewal-request
// @desc    Submit subscription renewal request
// @access  Private
router.post('/me/renewal-request', auth, doctorController.submitRenewalRequest);

// @route   POST api/doctors/me/commission-payment
// @desc    Submit commission payment request
// @access  Private
router.post('/me/commission-payment', auth, doctorController.submitCommissionPayment);

module.exports = router;
