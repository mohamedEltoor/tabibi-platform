const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        unique: true,
        sparse: true, // Crucial for allowing multiple guests with user: null
    },
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    isGuest: {
        type: Boolean,
        default: false
    },
    dateOfBirth: Date,
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
    },
    bloodType: String,
    allergies: [String],
    chronicConditions: [String],
    emergencyContact: {
        name: String,
        phone: String,
        relation: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Patient', PatientSchema);
