const mongoose = require('mongoose');

const ClinicSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: [Number], // [longitude, latitude]
    },
    images: [String],
    doctors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

ClinicSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Clinic', ClinicSchema);
