const mongoose = require('mongoose');
require('dotenv').config();

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const Doctor = require('./src/models/Doctor');

        const now = new Date();
        const trialEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const result = await Doctor.updateMany(
            { trialExpiresAt: { $exists: false } },
            { $set: { trialExpiresAt: trialEnd } }
        );

        console.log('Migration completed:', result);
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
