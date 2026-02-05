const Patient = require('../models/Patient');
const User = require('../models/User');
const EMR = require('../models/EMR');

exports.getPatientProfile = async (req, res) => {
    try {
        const patient = await Patient.findOne({ user: req.user.id }).populate('user', ['name', 'email']);
        if (!patient) {
            return res.status(404).json({ msg: 'Patient profile not found' });
        }
        res.json(patient);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.createOrUpdateProfile = async (req, res) => {
    try {
        const { dateOfBirth, gender, bloodType, allergies, chronicConditions, emergencyContact } = req.body;

        const profileFields = {
            user: req.user.id,
            dateOfBirth,
            gender,
            bloodType,
            allergies,
            chronicConditions,
            emergencyContact
        };

        let patient = await Patient.findOne({ user: req.user.id });

        if (patient) {
            // Update
            patient = await Patient.findOneAndUpdate(
                { user: req.user.id },
                { $set: profileFields },
                { new: true }
            );
            return res.json(patient);
        }

        // Create
        patient = new Patient(profileFields);
        await patient.save();
        res.json(patient);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getMyHistory = async (req, res) => {
    try {
        const patient = await Patient.findOne({ user: req.user.id });
        if (!patient) {
            return res.json([]); // No profile yet, so no history
        }

        const history = await EMR.find({ patient: patient._id })
            .populate('doctor', 'user specialty')
            .populate({
                path: 'doctor',
                populate: { path: 'user', select: 'name' }
            })
            .sort({ visitDate: -1 });

        res.json(history);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.updateMyProfile = async (req, res) => {
    try {
        const { dateOfBirth, gender, bloodType, allergies, chronicConditions, emergencyContact } = req.body;

        let patient = await Patient.findOne({ user: req.user.id });

        if (!patient) {
            // Auto-create if not exists
            const user = await User.findById(req.user.id);
            patient = new Patient({
                user: req.user.id,
                name: user ? user.name : 'Unknown',
                phone: user ? user.phone : 'N/A'
            });
        }

        if (dateOfBirth) patient.dateOfBirth = dateOfBirth;
        if (gender) patient.gender = gender;
        if (bloodType) patient.bloodType = bloodType;
        if (allergies) patient.allergies = allergies;
        if (chronicConditions) patient.chronicConditions = chronicConditions;
        if (emergencyContact) patient.emergencyContact = emergencyContact;

        await patient.save();
        res.json(patient);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
