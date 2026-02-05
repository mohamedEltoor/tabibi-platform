const EMR = require('../models/EMR');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { supabase } = require('../middleware/uploadMiddleware');

// Helper to resolve patient from ID (which might be a guest ID)
const resolvePatient = async (idOrGuestId, doctorId) => {
    let patient = null;

    if (idOrGuestId.startsWith('guest_')) {
        const phone = idOrGuestId.replace('guest_', '');
        // Find existing guest patient by phone
        patient = await Patient.findOne({ phone, isGuest: true });

        if (!patient) {
            // Need name to create, but in GET request we might only have ID.
            // For GET, we might fail if not found. For POST, we expect body to contain name if creating.
            return null;
        }
    } else {
        patient = await Patient.findById(idOrGuestId).populate('user');
        if (!patient) {
            // Check if it's a User ID passed instead of Patient ID (common confusion)
            // But our doctorController returns Patient ID (if patient exists) or User ID?
            // doctorController previously returned: app.patient (User object).
            // Wait, Appointments reference 'User' as 'patient'.
            // The Patient model references 'User'.
            // So 'patient' in Appointment is actually a User.

            // If the ID passed is a User ID, we need to find the corresponding Patient profile
            patient = await Patient.findOne({ user: idOrGuestId });

            if (!patient) {
                // If User exists but no Patient profile, effectively "create" one or treat as transient?
                // For EMR, we NEED a Patient profile.
                const user = await User.findById(idOrGuestId);
                if (user) {
                    // Auto-create Patient profile for this User if it doesn't exist?
                    // Safe to do so.
                    patient = new Patient({
                        user: user._id,
                        name: user.name,
                        phone: user.phone || 'N/A', // Should exist
                        gender: 'male', // Default or fetch?
                        dateOfBirth: new Date(), // placeholder
                    });
                    await patient.save();
                }
            }
        }
    }
    return patient;
};

exports.getPatientProfile = async (req, res) => {
    try {
        const { patientId } = req.params;
        let patient = null;

        if (patientId.startsWith('guest_')) {
            const phone = patientId.replace('guest_', '');
            // Try to find if we already created a profile
            patient = await Patient.findOne({ phone: phone });

            if (!patient) {
                // If not found in Patients table, we might need to fetch from Appointment history to display basic info
                // But effectively, if we haven't created a profile yet, we just return basic info from params if possible?
                // No, we should look up the last appointment to get name/phone.
                const doctor = await Doctor.findOne({ user: req.user.id });
                const lastApp = await Appointment.findOne({
                    'guestDetails.phone': phone,
                    doctor: doctor._id
                }).sort({ date: -1 });

                if (lastApp) {
                    return res.json({
                        _id: patientId,
                        name: lastApp.guestDetails.name,
                        phone: lastApp.guestDetails.phone,
                        type: 'guest',
                        isNew: true // Flag to say "Not persisted in Patient DB yet"
                    });
                }
                return res.status(404).json({ msg: 'Patient not found' });
            }
        } else {
            // It's a User ID likely
            const user = await User.findById(patientId);
            if (user) {
                // Check for Patient profile
                let patientProfile = await Patient.findOne({ user: patientId });
                if (!patientProfile) {
                    // Return User data masquerading as patient
                    return res.json({
                        _id: user._id,
                        name: user.name,
                        phone: user.phone,
                        email: user.email,
                        type: 'registered',
                        isNew: true
                    });
                }
                patient = patientProfile;
            }
        }

        if (!patient) return res.status(404).json({ msg: 'Patient not found' });
        res.json(patient);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getPatientHistory = async (req, res) => {
    try {
        const { patientId } = req.params;
        const doctor = await Doctor.findOne({ user: req.user.id });
        if (!doctor) return res.status(401).json({ msg: 'Doctor not found' });

        let targetPhone = null;

        // 1. Resolve Phone Number from ID
        if (patientId.startsWith('guest_')) {
            targetPhone = patientId.replace('guest_', '');
        } else {
            // Assuming patientId is User ID
            const user = await User.findById(patientId);
            if (user) targetPhone = user.phone;
        }

        if (!targetPhone) {
            return res.json([]); // Can't resolve phone, can't find history
        }

        // 2. Find ALL Patient records with this phone (Guest profiles AND Registered profiles)
        const patientRecords = await Patient.find({ phone: targetPhone });
        const patientIds = patientRecords.map(p => p._id);

        if (patientIds.length === 0) {
            return res.json([]);
        }

        // 3. Fetch EMRs for ANY of these patient IDs
        const emrs = await EMR.find({
            doctor: doctor._id,
            patient: { $in: patientIds }
        }).sort({ visitDate: -1 });

        res.json(emrs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.createVisit = async (req, res) => {
    try {
        const { patientId } = req.params; // Can be guest_... or User ID
        const { diagnosis, symptoms, prescriptions, notes, visitDate, patientName, attachments } = req.body;

        const doctor = await Doctor.findOne({ user: req.user.id });
        if (!doctor) return res.status(401).json({ msg: 'Doctor not found' });

        let patientRecord = null;

        // 1. Resolve or Create Patient Record
        if (patientId.startsWith('guest_')) {
            const phone = patientId.replace('guest_', '');
            patientRecord = await Patient.findOne({ phone: phone });

            if (!patientRecord) {
                // Create new Guest Patient
                patientRecord = new Patient({
                    name: patientName || 'Guest Patient', // Required from body if new
                    phone: phone,
                    isGuest: true,
                    gender: 'male' // Default
                });
                await patientRecord.save();
            }
        } else {
            // It's a User ID
            patientRecord = await Patient.findOne({ user: patientId });

            if (!patientRecord) {
                // Determine name/phone for User
                const user = await User.findById(patientId);
                if (!user) return res.status(404).json({ msg: 'User not found' });

                patientRecord = new Patient({
                    user: user._id,
                    name: user.name,
                    phone: user.phone || 'N/A',
                    isGuest: false
                });
                await patientRecord.save();
            }
        }

        // 2. Create EMR Record
        const emr = new EMR({
            doctor: doctor._id,
            patient: patientRecord._id,
            visitDate: visitDate || new Date(),
            diagnosis,
            symptoms,
            prescriptions,
            notes,
            attachments: attachments || []
        });

        await emr.save();
        res.json(emr);

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

exports.updateVisit = async (req, res) => {
    try {
        const { visitId } = req.params;
        const { diagnosis, symptoms, prescriptions, notes, visitDate, attachments } = req.body;

        const doctor = await Doctor.findOne({ user: req.user.id });
        if (!doctor) return res.status(401).json({ msg: 'Doctor not found' });

        let emr = await EMR.findById(visitId);
        if (!emr) return res.status(404).json({ msg: 'Visit record not found' });

        // Ensure the doctor owns this record
        if (emr.doctor.toString() !== doctor._id.toString()) {
            return res.status(401).json({ msg: 'Not authorized to edit this record' });
        }

        // Update fields
        if (diagnosis) emr.diagnosis = diagnosis;
        if (symptoms) emr.symptoms = symptoms;
        if (prescriptions) emr.prescriptions = prescriptions;
        if (notes !== undefined) emr.notes = notes;
        if (visitDate) emr.visitDate = visitDate;
        if (attachments) emr.attachments = attachments;

        await emr.save();
        res.json(emr);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.updatePatientProfile = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { gender } = req.body;

        const doctor = await Doctor.findOne({ user: req.user.id });
        if (!doctor) return res.status(401).json({ msg: 'Doctor not found' });

        let patient = await resolvePatient(patientId, doctor._id);

        if (!patient) {
            // If it's a guest we haven't persisted yet, we might need more info to create it.
            // But usually we'd only update an existing one.
            return res.status(404).json({ msg: 'Patient not found' });
        }

        if (gender) {
            patient.gender = gender;
        }

        await patient.save();
        res.json(patient);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

exports.uploadAttachments = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ msg: 'No files uploaded' });
        }

        const fileUrls = await Promise.all(req.files.map(async (file) => {
            // Memory Storage (Production/Supabase)
            if (file.buffer && process.env.SUPABASE_URL) {
                const fileName = `emr/${Date.now()}-${file.originalname}`;
                const { data, error } = await supabase.storage
                    .from('tabibi')
                    .upload(fileName, file.buffer, {
                        contentType: file.mimetype,
                        upsert: true
                    });

                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage
                    .from('tabibi')
                    .getPublicUrl(fileName);

                return publicUrl;
            }

            // Disk Storage (Development/Local)
            return `/api/uploads/emr/${file.filename}`;
        }));
        res.json({ urls: fileUrls });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};
