const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

exports.bookAppointment = async (req, res) => {
    try {
        const { doctorId, date, time, source, phone } = req.body;

        // Check availability
        const existingAppointment = await Appointment.findOne({
            doctor: doctorId,
            date: date,
            time: time,
            status: { $ne: 'cancelled' }
        });

        if (existingAppointment) {
            return res.status(400).json({ msg: 'هذا الموعد محجوز بالفعل' });
        }

        // Get doctor to check fee
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ msg: 'Doctor not found' });
        }

        const fee = doctor.pricing?.consultationFee || 0;
        const commissionAmount = source === 'website' ? (fee * 0.15) : 0;

        const appointmentFields = {
            doctor: doctorId,
            date,
            time,
            source,
            commission: {
                amount: commissionAmount,
            }
        };

        if (req.body.guestDetails) {
            // Validate guest details
            if (!req.body.guestDetails.name || !req.body.guestDetails.phone) {
                return res.status(400).json({ msg: 'يرجى إدخال اسم المريض ورقم الهاتف' });
            }

            // Check if user exists with this phone
            const existingUser = await User.findOne({ phone: req.body.guestDetails.phone });

            if (existingUser) {
                // Open Flow: Automatically link to existing user even if source is website
                // This allows returning users to book without logging in (No Password required for booking)
                appointmentFields.patient = existingUser._id;
            } else {
                // New user -> Keep as guest
                appointmentFields.guestDetails = req.body.guestDetails;
            }
        } else if (req.user) {
            appointmentFields.patient = req.user.id;

            // If logged-in user provided phone, update their profile
            if (phone) {
                await User.findByIdAndUpdate(req.user.id, { phone: phone });
            }
        } else {
            return res.status(401).json({ msg: 'يرجى تسجيل الدخول أو إدخال بيانات المريض' });
        }

        const appointment = new Appointment(appointmentFields);

        await appointment.save();
        res.json(appointment);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getMyAppointments = async (req, res) => {
    try {
        // Find appointments where user is patient OR doctor (need to look up doctor profile if user is doctor)
        // For now, let's assume this is for patients
        const appointments = await Appointment.find({ patient: req.user.id })
            .populate('doctor')
            .sort({ date: -1 });
        res.json(appointments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getDoctorAppointments = async (req, res) => {
    try {
        // Verify user is a doctor
        const doctor = await Doctor.findOne({ user: req.user.id });
        if (!doctor) {
            console.log(`[Appointment] User ${req.user.id} is a doctor but has no profile yet. Returning empty appointments.`);
            return res.json([]);
        }

        const appointments = await Appointment.find({ doctor: doctor._id })
            .populate('patient', ['name', 'email', 'phone'])
            .sort({ date: -1 });
        res.json(appointments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.updateAppointmentStatus = async (req, res) => {
    try {
        const { status } = req.body;

        // Find appointment
        let appointment = await Appointment.findById(req.params.id).populate('doctor');

        if (!appointment) {
            return res.status(404).json({ msg: 'Appointment not found' });
        }

        // Check if the current user is the doctor owner
        const doctor = await Doctor.findOne({ user: req.user.id });
        if (!doctor || doctor._id.toString() !== appointment.doctor._id.toString()) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        appointment.status = status;
        await appointment.save();
        res.json(appointment);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
