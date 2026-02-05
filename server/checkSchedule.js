const mongoose = require('mongoose');
const Doctor = require('./src/models/Doctor');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Find the most recently updated doctor
        const doctor = await Doctor.findOne().sort({ updatedAt: -1 });

        if (doctor) {
            console.log('Doctor found:', doctor.user);
            console.log('Schedule:', JSON.stringify(doctor.schedule, null, 2));
        } else {
            console.log('No doctor found');
        }

        process.exit();
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

connectDB();
