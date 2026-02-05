const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '.env') });

const Appointment = require('./src/models/Appointment');
const Doctor = require('./src/models/Doctor');

async function update() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const appointments = await Appointment.find({ source: 'website' });
        console.log(`Found ${appointments.length} website appointments`);

        for (const app of appointments) {
            const doctor = await Doctor.findById(app.doctor);
            if (doctor && doctor.pricing && doctor.pricing.consultationFee) {
                const newCommission = doctor.pricing.consultationFee * 0.15;
                app.commission = {
                    amount: newCommission,
                    paid: app.commission?.paid || false
                };
                await app.save();
                console.log(`Updated appointment ${app._id} to commission ${newCommission}`);
            }
        }

        console.log('Finished updating');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

update();
