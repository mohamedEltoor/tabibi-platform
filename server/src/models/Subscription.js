const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    amount: {
        type: Number,
        default: 0
    },
    paymentMethod: {
        type: String,
        default: 'e-wallet'
    },
    paymentPhone: String,
    receiptImage: String,
    status: {
        type: String,
        enum: ['active', 'expired', 'cancelled'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);
