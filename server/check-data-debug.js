const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Doctor = require('./src/models/Doctor');
const User = require('./src/models/User');

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tabibi');
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const checkData = async () => {
    await connectDB();

    console.log('--- Checking Doctors ---');
    const doctors = await Doctor.find({});
    console.log(`Found ${doctors.length} doctors`);

    doctors.forEach(doc => {
        if (!doc._id) {
            console.error('FOUND DOCTOR WITHOUT ID:', doc);
        }
        // console.log(`Doctor ID: ${doc._id}, User: ${doc.user}`);
    });

    console.log('--- API Simulation: searchDoctors ---');
    // Simulate what standard search returns
    const searchResults = await Doctor.find({ isProfileComplete: true }).populate('user', 'name');

    searchResults.forEach(doc => {
        if (!doc._id) console.error('RESULT WITHOUT ID:', doc);
        // console.log(`Search Result: ${doc._id}, Name: ${doc.user?.name}`);
    });

    process.exit();
};

checkData();
