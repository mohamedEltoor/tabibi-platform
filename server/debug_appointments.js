const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function debugAppointments() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const User = require('./src/models/User');
        const Doctor = require('./src/models/Doctor');
        const Appointment = require('./src/models/Appointment');

        const adminEmail = 'dev.mohamedeltoor@gmail.com';
        const user = await User.findOne({ email: adminEmail });
        if (!user) {
            console.log('Admin user not found');
            process.exit(0);
        }

        const doctor = await Doctor.findOne({ user: user._id });
        if (!doctor) {
            console.log('Doctor profile not found for admin');
            process.exit(0);
        }

        console.log(`Doctor ID: ${doctor._id}`);

        const appointments = await Appointment.find({ doctor: doctor._id });
        console.log(`Total appointments found: ${appointments.length}`);

        console.log('--- Website Appointments Detail ---');
        appointments.filter(a => a.source === 'website').forEach(a => {
            console.log(`Date: ${a.date}, Status: ${a.status}, Paid: ${a.commission?.paid}, ID: ${a._id}`);
        });

        const attendedCount = appointments.filter(a => a.source === 'website' && a.status === 'attended').length;
        console.log(`\nFiltered Attended Website Count: ${attendedCount}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugAppointments();
