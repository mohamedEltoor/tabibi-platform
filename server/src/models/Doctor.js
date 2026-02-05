const mongoose = require('mongoose'); // Trigger restart

const DoctorSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    specialty: {
        type: String,
        required: true,
    },
    subspecialty: {
        type: String,
        default: '',
    },
    title: {
        type: String,
        default: '', // e.g., 'Consultant', 'Specialist', 'Professor'
    },
    gender: {
        type: String,
        enum: ['male', 'female'],
        default: 'male'
    },
    bio: String,
    profileImage: {
        type: String,
        default: ''
    },
    yearsOfExperience: {
        type: Number,
        default: 0
    },
    location: {
        lat: { type: Number },
        lng: { type: Number }
    },
    pricing: {
        consultationFee: Number,
        currency: { type: String, default: 'EGP' },
    },
    schedule: {
        dailySchedules: [{
            day: { type: String, required: true },
            startTime: { type: String, default: '10:00' },
            endTime: { type: String, default: '22:00' },
            enabled: { type: Boolean, default: false }
        }],
        slotDuration: {
            type: Number,
            default: 30, // minutes
        },
        waitingTime: {
            type: Number,
            default: 0, // minutes
        },
    },
    rating: {
        type: Number,
        default: 0,
    },
    reviewsCount: {
        type: Number,
        default: 0,
    },
    clinic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic',
    },
    isProfileComplete: {
        type: Boolean,
        default: false,
    },
    // Subscription & Access
    trialExpiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from creation
    },
    subscriptionExpiresAt: {
        type: Date,
    },
    isManuallyDeactivated: {
        type: Boolean,
        default: false,
    },
    isPaused: {
        type: Boolean,
        default: false,
    },
    renewalRequest: {
        phone: String,
        receiptImage: String,
        status: {
            type: String,
            enum: ['none', 'pending', 'approved', 'rejected'],
            default: 'none'
        },
        requestedAt: Date
    },
    commissionPaymentRequest: {
        phone: String,
        receiptImage: String,
        amount: Number,
        status: {
            type: String,
            enum: ['none', 'pending', 'approved', 'rejected'],
            default: 'none'
        },
        requestedAt: Date
    },
    fixedSubscriptionFee: {
        type: Number,
        default: 150
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Doctor', DoctorSchema);
