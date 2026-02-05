require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Doctor = require('./src/models/Doctor');
const Appointment = require('./src/models/Appointment');

const deleteUserByEmail = async (email) => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to database');

        // Find the user
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`❌ User with email ${email} not found`);
            process.exit(0);
        }

        console.log(`\n📧 Found user:`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Auth Provider: ${user.authProvider}`);
        console.log(`   Created: ${user.createdAt}`);

        // Delete related doctor profile if exists
        if (user.role === 'doctor') {
            const doctor = await Doctor.findOne({ user: user._id });
            if (doctor) {
                await Doctor.deleteOne({ user: user._id });
                console.log(`✅ Deleted doctor profile`);
            }
        }

        // Delete related appointments
        const appointments = await Appointment.deleteMany({
            $or: [
                { patient: user._id },
                { doctor: user._id }
            ]
        });
        if (appointments.deletedCount > 0) {
            console.log(`✅ Deleted ${appointments.deletedCount} appointment(s)`);
        }

        // Delete the user
        await User.deleteOne({ email });
        console.log(`✅ User ${email} deleted successfully!\n`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

// Run the script
const emailToDelete = process.argv[2] || 'rabeaeltur@gmail.com';
deleteUserByEmail(emailToDelete);
