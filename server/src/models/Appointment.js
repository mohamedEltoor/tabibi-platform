const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true,
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false, // Changed from true to allow guest/walk-in
    },
    guestDetails: {
        name: String,
        phone: String,
    },
    date: {
        type: Date,
        required: true,
    },
    time: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled', 'attended', 'no_show'],
        default: 'pending',
    },
    source: {
        type: String,
        enum: ['website', 'direct'],
        required: true,
    },
    commission: {
        amount: Number,
        paid: { type: Boolean, default: false },
    },
    notes: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
