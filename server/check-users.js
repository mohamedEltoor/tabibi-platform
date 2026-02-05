const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('MongoDB Connected');

        // Find all users
        const users = await User.find({});
        console.log('\n=== All Users in Database ===');
        console.log('Total Users:', users.length);
        users.forEach((user, index) => {
            console.log(`\n${index + 1}. ${user.name}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Role: ${user.role}`);
            if (user.phone) console.log(`   Phone: ${user.phone}`);
            if (user.governorate) console.log(`   Governorate: ${user.governorate}`);
            if (user.city) console.log(`   City: ${user.city}`);
            if (user.address) console.log(`   Address: ${user.address}`);
        });

        // Find doctors specifically
        const doctors = await User.find({ role: 'doctor' });
        console.log(`\n=== Total Doctors: ${doctors.length} ===`);

        const Doctor = require('./src/models/Doctor');

        for (const [index, doctor] of doctors.entries()) {
            console.log(`\n${index + 1}. Dr. ${doctor.name}`);
            console.log(`   Email: ${doctor.email}`);
            console.log(`   ID: ${doctor._id}`);

            const doctorProfile = await Doctor.findOne({ user: doctor._id });
            if (doctorProfile) {
                console.log(`   [OK] Doctor Profile Found (Specialty: ${doctorProfile.specialty})`);
            } else {
                console.log(`   [ERROR] No Doctor Profile Found! (This causes 401)`);
            }
        }

        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
