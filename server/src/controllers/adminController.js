const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Appointment = require('../models/Appointment');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getAllDoctors = async (req, res) => {
    try {
        const { governorate, city, specialty, name, gender, minPrice, maxPrice, status } = req.query;

        // Build user filter
        let userFilter = { role: 'doctor' };
        if (governorate) userFilter.governorate = governorate;
        if (city) userFilter.city = city;
        if (name) userFilter.name = { $regex: name, $options: 'i' };

        // Find users
        const users = await User.find(userFilter).select('_id');
        const userIds = users.map(u => u._id);

        // Build doctor filter
        let doctorFilter = { user: { $in: userIds } };
        if (specialty) doctorFilter.specialty = { $regex: specialty, $options: 'i' };
        if (gender) doctorFilter.gender = gender;

        if (minPrice || maxPrice) {
            doctorFilter['pricing.consultationFee'] = {};
            if (minPrice) doctorFilter['pricing.consultationFee'].$gte = Number(minPrice);
            if (maxPrice) doctorFilter['pricing.consultationFee'].$lte = Number(maxPrice);
        }

        // Status Filter Logic
        const now = new Date();
        if (status === 'active') {
            doctorFilter.isManuallyDeactivated = { $ne: true };
            doctorFilter.isPaused = { $ne: true };
            doctorFilter.$or = [
                { subscriptionExpiresAt: { $gt: now } },
                { trialExpiresAt: { $gt: now } }
            ];
        } else if (status === 'expired') {
            doctorFilter.isManuallyDeactivated = { $ne: true };
            doctorFilter.isPaused = { $ne: true };
            doctorFilter.subscriptionExpiresAt = { $lte: now };
            doctorFilter.trialExpiresAt = { $lte: now };
        } else if (status === 'paused') {
            doctorFilter.isPaused = true;
        } else if (status === 'deactivated') {
            doctorFilter.isManuallyDeactivated = true;
        } else if (status === 'pending_requests') {
            doctorFilter.$or = [
                { 'renewalRequest.status': 'pending' },
                { 'commissionPaymentRequest.status': 'pending' }
            ];
        } else if (status === 'overdue') {
            // Overdue is after the 5th with unpaid last month commissions
            // This is hard to do with just a filter, but we can approximate or use a post-query filter
            // For now, let's treat "overdue" as "blocked due to debt"
            // Actually, we'll implement a custom filter logic below
        }

        const doctors = await Doctor.find(doctorFilter)
            .populate('user', ['name', 'email', 'phone', 'governorate', 'city', 'address'])
            .sort({ createdAt: -1 });

        res.json(doctors);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getAdminStats = async (req, res) => {
    try {
        const now = new Date();
        const stats = {
            totalDoctors: await Doctor.countDocuments(),
            activeDoctors: await Doctor.countDocuments({
                isManuallyDeactivated: { $ne: true },
                isPaused: { $ne: true },
                $or: [
                    { subscriptionExpiresAt: { $gt: now } },
                    { trialExpiresAt: { $gt: now } }
                ]
            }),
            pendingRequests: await Doctor.countDocuments({
                $or: [
                    { 'renewalRequest.status': 'pending' },
                    { 'commissionPaymentRequest.status': 'pending' }
                ]
            }),
            totalUsers: await User.countDocuments()
        };
        res.json(stats);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.approveRenewal = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor || !doctor.renewalRequest) {
            return res.status(404).json({ msg: 'Renewal request not found' });
        }

        // Calculate new expiry (from now or from current expiry if it's in the future)
        const currentExpiry = doctor.subscriptionExpiresAt || doctor.trialExpiresAt || new Date();
        const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
        const newExpiry = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);

        // Record the subscription history
        const subscription = new Subscription({
            doctor: doctor._id,
            startDate: baseDate,
            endDate: newExpiry,
            paymentPhone: doctor.renewalRequest.phone,
            receiptImage: doctor.renewalRequest.receiptImage,
            status: 'active'
        });
        await subscription.save();

        // Update Doctor
        doctor.subscriptionExpiresAt = newExpiry;
        doctor.isManuallyDeactivated = false;
        doctor.isPaused = false;
        doctor.renewalRequest = { status: 'approved' }; // Clear but mark as approved


        await doctor.save();
        res.json({ msg: 'تم الموافقة على طلب التجديد بنجاح', doctor });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.approveCommissionPayment = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor || !doctor.commissionPaymentRequest) {
            return res.status(404).json({ msg: 'Commission payment request not found' });
        }

        // Mark all previous website commissions as paid
        // For simplicity, we assume the payment covers all unpaid commissions up to now
        await Appointment.updateMany(
            {
                doctor: doctor._id,
                source: 'website',
                'commission.paid': false
            },
            {
                $set: { 'commission.paid': true }
            }
        );

        // Update Request Status
        doctor.commissionPaymentRequest.status = 'approved';

        await doctor.save();
        res.json({ msg: 'تم الموافقة على سداد العمولات بنجاح', doctor });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getDoctorSummary = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id).populate('user', ['name', 'email', 'phone']);
        if (!doctor) return res.status(404).json({ msg: 'Doctor not found' });

        const subscriptions = await Subscription.find({ doctor: doctor._id }).sort({ createdAt: -1 });

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const appointments = await Appointment.find({ doctor: doctor._id });

        const stats = {
            lifetime: {
                total: appointments.length,
                website: appointments.filter(a => a.source === 'website').length,
                direct: appointments.filter(a => a.source === 'direct').length,
                attendedWebsite: appointments.filter(a => a.source === 'website' && a.status === 'attended').length,
                commission: appointments
                    .filter(a => a.source === 'website' && a.status === 'attended')
                    .reduce((acc, curr) => acc + (doctor.pricing?.consultationFee * 0.15 || 0), 0),
                unpaidCommission: appointments
                    .filter(a => a.source === 'website' && a.status === 'attended' && !a.commission?.paid)
                    .reduce((acc, curr) => acc + (doctor.pricing?.consultationFee * 0.15 || 0), 0)
            },
            thisMonth: {
                total: appointments.filter(a => new Date(a.date) >= startOfMonth).length,
                website: appointments.filter(a => new Date(a.date) >= startOfMonth && a.source === 'website').length,
                direct: appointments.filter(a => new Date(a.date) >= startOfMonth && a.source === 'direct').length,
                attendedWebsite: appointments.filter(a => new Date(a.date) >= startOfMonth && a.source === 'website' && a.status === 'attended').length,
                commission: appointments
                    .filter(a => new Date(a.date) >= startOfMonth && a.source === 'website' && a.status === 'attended')
                    .reduce((acc, curr) => acc + (doctor.pricing?.consultationFee * 0.15 || 0), 0),
                unpaidCommission: appointments
                    .filter(a => new Date(a.date) >= startOfMonth && a.source === 'website' && a.status === 'attended' && !a.commission?.paid)
                    .reduce((acc, curr) => acc + (doctor.pricing?.consultationFee * 0.15 || 0), 0)
            }
        };

        res.json({ doctor, subscriptions, stats });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.activateDoctorSubscription = async (req, res) => {
    // ... (omitted for brevity, keep the rest of the file)
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({ msg: 'Doctor not found' });
        }

        // Activate for 30 days from now
        doctor.subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        doctor.isManuallyDeactivated = false;

        await doctor.save();
        res.json({ msg: 'تم تفعيل الاشتراك لمدة 30 يوم بنجاح', doctor });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.deactivateDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({ msg: 'Doctor not found' });
        }

        doctor.isManuallyDeactivated = true;

        await doctor.save();
        res.json({ msg: 'تم تعطيل الطبيب بنجاح', doctor });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.deleteDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({ msg: 'Doctor not found' });
        }

        const userId = doctor.user;

        // Delete Doctor profile
        await Doctor.findByIdAndDelete(req.params.id);

        // Delete associated User
        await User.findByIdAndDelete(userId);

        res.json({ msg: 'تم حذف الطبيب وحسابه نهائياً بنجاح' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.togglePauseDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({ msg: 'Doctor not found' });
        }

        doctor.isPaused = !doctor.isPaused;

        await doctor.save();
        const statusMsg = doctor.isPaused ? 'تم إيقاف الطبيب مؤقتاً' : 'تم استئناف عمل الطبيب';
        res.json({ msg: statusMsg, doctor, isPaused: doctor.isPaused });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
