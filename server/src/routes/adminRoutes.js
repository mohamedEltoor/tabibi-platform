const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');

// Middleware to check if user is admin
const adminAuth = (req, res, next) => {
    const ADMIN_EMAIL = 'dev.mohamedeltoor@gmail.com';

    console.log(`[AdminAuth Debug] User Role: ${req.user?.role}, User Email: ${req.user?.email}`);

    if (req.user.role !== 'admin' || !req.user.email || req.user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        console.warn(`[Security] Unauthorized admin access attempt by: ${req.user.email || 'Unknown Email'} (Role: ${req.user.role})`);
        return res.status(403).json({
            msg: 'Access denied. Only authorized admin allowed.',
            debugInfo: process.env.NODE_ENV === 'development' ? { role: req.user.role, email: req.user.email } : undefined
        });
    }
    next();
};

// @route   GET api/admin/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/users', [auth, adminAuth], adminController.getAllUsers);

// @route   GET api/admin/doctors
// @desc    Get all doctors with filters
// @access  Private (Admin)
router.get('/doctors', [auth, adminAuth], adminController.getAllDoctors);

// @route   PUT api/admin/doctors/:id/activate-subscription
// @desc    Activate 30-day subscription for a doctor
// @access  Private (Admin)
router.put('/doctors/:id/activate-subscription', [auth, adminAuth], adminController.activateDoctorSubscription);

// @route   PUT api/admin/doctors/:id/deactivate
// @desc    Manually deactivate a doctor
// @access  Private (Admin)
router.put('/doctors/:id/deactivate', [auth, adminAuth], adminController.deactivateDoctor);

// @route   DELETE api/admin/doctors/:id
// @desc    Permanently delete a doctor and user
// @access  Private (Admin)
router.delete('/doctors/:id', [auth, adminAuth], adminController.deleteDoctor);

// @route   GET api/admin/stats
// @desc    Get dashboard stats
// @access  Private (Admin)
router.get('/stats', [auth, adminAuth], adminController.getAdminStats);

// @route   PUT api/admin/doctors/:id/approve-renewal
// @desc    Approve a manual renewal request
// @access  Private (Admin)
router.put('/doctors/:id/approve-renewal', [auth, adminAuth], adminController.approveRenewal);

// @route   GET api/admin/doctors/:id/summary
// @desc    Get detailed summary of a doctor
// @access  Private (Admin)
router.get('/doctors/:id/summary', [auth, adminAuth], adminController.getDoctorSummary);

// @route   PUT api/admin/doctors/:id/approve-commission
// @desc    Approve a manual commission payment
// @access  Private (Admin)
router.put('/doctors/:id/approve-commission', [auth, adminAuth], adminController.approveCommissionPayment);

// @route   PUT api/admin/doctors/:id/toggle-pause
// @desc    Pause/Resume a doctor
// @access  Private (Admin)
router.put('/doctors/:id/toggle-pause', [auth, adminAuth], adminController.togglePauseDoctor);

module.exports = router;
