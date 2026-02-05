const mongoose = require('mongoose');

const EMRSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true,
    },
    appointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
    },
    visitDate: {
        type: Date,
        required: true,
    },
    diagnosis: String,
    symptoms: [String],
    prescriptions: [{
        medication: String,
        dosage: String,
        duration: String,
        notes: String,
    }],
    labTests: [{
        testName: String,
        result: String,
        date: Date,
    }],
    notes: String,
    attachments: [String], // URLs to files
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('EMR', EMRSchema);
