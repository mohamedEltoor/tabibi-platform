/**
 * Seed Script - Populates the database with realistic test data
 * Run: node src/scripts/seed.js
 * 
 * Creates:
 * - 3 test doctors       (with different specialties)
 * - 5 test patients      (registered users)
 * - 60+ appointments     (spanning 3 months: past, current, future)
 * - Commission data      (website bookings with 15% commission)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');

const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');

// === HELPERS ===
const daysAgo = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
};

const daysFromNow = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
};

const randomTime = () => {
    const hours = 10 + Math.floor(Math.random() * 10); // 10-19
    const mins = Math.random() > 0.5 ? '00' : '30';
    return `${hours}:${mins}`;
};

const randomStatus = (isPast) => {
    if (!isPast) return 'pending';
    const statuses = ['attended', 'attended', 'attended', 'no_show', 'cancelled'];
    return statuses[Math.floor(Math.random() * statuses.length)];
};

const randomSource = () => Math.random() > 0.4 ? 'website' : 'direct';

// === MAIN SEED ===
async function seed() {
    await connectDB();
    console.log('🌱 Starting seed...\n');

    // 1. CREATE DOCTOR USERS
    const hashedPassword = await bcrypt.hash('Test1234!', 10);

    const doctorUsers = [];
    const doctorsData = [
        { name: 'د. أحمد محمد', email: 'doctor1@test.com', phone: '01012345678', specialty: 'طب القلب', fee: 300, governorate: 'القاهرة', city: 'مدينة نصر' },
        { name: 'د. سارة علي', email: 'doctor2@test.com', phone: '01098765432', specialty: 'طب الأطفال', fee: 200, governorate: 'الجيزة', city: 'الدقي' },
        { name: 'د. محمود حسن', email: 'doctor3@test.com', phone: '01155556666', specialty: 'طب العظام', fee: 250, governorate: 'القاهرة', city: 'المعادي' },
    ];

    for (const d of doctorsData) {
        let user = await User.findOne({ email: d.email });
        if (!user) {
            user = await User.create({
                name: d.name,
                email: d.email,
                password: hashedPassword,
                role: 'doctor',
                phone: d.phone,
                governorate: d.governorate,
                city: d.city,
                isEmailVerified: true,
                authProvider: 'local',
            });
        }
        doctorUsers.push({ user, ...d });
    }
    console.log(`✅ ${doctorUsers.length} doctor users ready`);

    // 2. CREATE DOCTOR PROFILES
    const doctors = [];
    for (const d of doctorUsers) {
        let doctor = await Doctor.findOne({ user: d.user._id });
        if (!doctor) {
            doctor = await Doctor.create({
                user: d.user._id,
                specialty: d.specialty,
                title: 'استشاري',
                gender: d.email === 'doctor2@test.com' ? 'female' : 'male',
                yearsOfExperience: 10 + Math.floor(Math.random() * 15),
                pricing: { consultationFee: d.fee, currency: 'EGP' },
                location: { lat: 30.04 + Math.random() * 0.1, lng: 31.22 + Math.random() * 0.1 },
                isProfileComplete: true,
                trialExpiresAt: daysFromNow(30),
                subscriptionExpiresAt: daysFromNow(60),
                schedule: {
                    slotDuration: 30,
                    waitingTime: 15,
                    dailySchedules: [
                        { day: 'Saturday', startTime: '10:00', endTime: '18:00', enabled: true },
                        { day: 'Sunday', startTime: '10:00', endTime: '18:00', enabled: true },
                        { day: 'Monday', startTime: '10:00', endTime: '18:00', enabled: true },
                        { day: 'Tuesday', startTime: '10:00', endTime: '18:00', enabled: true },
                        { day: 'Wednesday', startTime: '10:00', endTime: '18:00', enabled: true },
                    ],
                },
            });
        }
        doctors.push(doctor);
    }
    console.log(`✅ ${doctors.length} doctor profiles ready`);

    // 3. CREATE PATIENT USERS
    const patientUsers = [];
    const patientsData = [
        { name: 'محمد عبدالله', email: 'patient1@test.com', phone: '01211111111' },
        { name: 'فاطمة أحمد', email: 'patient2@test.com', phone: '01222222222' },
        { name: 'أحمد سعيد', email: 'patient3@test.com', phone: '01233333333' },
        { name: 'نورا حسين', email: 'patient4@test.com', phone: '01244444444' },
        { name: 'خالد إبراهيم', email: 'patient5@test.com', phone: '01255555555' },
    ];

    for (const p of patientsData) {
        let user = await User.findOne({ email: p.email });
        if (!user) {
            user = await User.create({
                name: p.name,
                email: p.email,
                password: hashedPassword,
                role: 'patient',
                phone: p.phone,
                isEmailVerified: true,
                authProvider: 'local',
            });
        }
        patientUsers.push(user);
    }
    console.log(`✅ ${patientUsers.length} patient users ready`);

    // 4. CREATE APPOINTMENTS (the main event!)
    let appointmentCount = 0;

    for (const doctor of doctors) {
        const fee = doctorsData[doctors.indexOf(doctor)].fee;

        // --- LAST MONTH appointments (30-60 days ago) ---
        for (let i = 0; i < 12; i++) {
            const daysBack = 35 + Math.floor(Math.random() * 25); // 35-60 days ago
            const source = randomSource();
            const status = randomStatus(true);
            const commissionAmount = source === 'website' ? fee * 0.15 : 0;

            await Appointment.create({
                doctor: doctor._id,
                patient: patientUsers[i % patientUsers.length]._id,
                date: daysAgo(daysBack),
                time: randomTime(),
                status,
                source,
                commission: {
                    amount: commissionAmount,
                    paid: Math.random() > 0.6, // Some paid, some not
                },
                createdAt: daysAgo(daysBack + 2),
            });
            appointmentCount++;
        }

        // --- THIS MONTH appointments (0-29 days ago) ---
        for (let i = 0; i < 15; i++) {
            const daysBack = Math.floor(Math.random() * 28); // 0-28 days ago
            const source = randomSource();
            const isPast = daysBack > 0;
            const status = randomStatus(isPast);
            const commissionAmount = source === 'website' ? fee * 0.15 : 0;

            await Appointment.create({
                doctor: doctor._id,
                patient: patientUsers[i % patientUsers.length]._id,
                date: daysAgo(daysBack),
                time: randomTime(),
                status,
                source,
                commission: {
                    amount: commissionAmount,
                    paid: false, // This month: unpaid
                },
                createdAt: daysAgo(daysBack + 1),
            });
            appointmentCount++;
        }

        // --- FUTURE appointments (1-14 days from now) ---
        for (let i = 0; i < 5; i++) {
            const daysAhead = 1 + Math.floor(Math.random() * 14);
            const source = randomSource();
            const commissionAmount = source === 'website' ? fee * 0.15 : 0;

            await Appointment.create({
                doctor: doctor._id,
                patient: patientUsers[i % patientUsers.length]._id,
                date: daysFromNow(daysAhead),
                time: randomTime(),
                status: 'pending',
                source,
                commission: {
                    amount: commissionAmount,
                    paid: false,
                },
                createdAt: daysAgo(1),
            });
            appointmentCount++;
        }

        // --- GUEST (walk-in) appointments ---
        for (let i = 0; i < 4; i++) {
            const daysBack = 2 + Math.floor(Math.random() * 20);
            await Appointment.create({
                doctor: doctor._id,
                guestDetails: {
                    name: `ضيف ${i + 1}`,
                    phone: `0100000000${i}`,
                },
                date: daysAgo(daysBack),
                time: randomTime(),
                status: 'attended',
                source: 'direct',
                commission: { amount: 0, paid: false },
                createdAt: daysAgo(daysBack),
            });
            appointmentCount++;
        }
    }

    console.log(`✅ ${appointmentCount} appointments created`);

    // 5. Summary
    console.log('\n🎉 Seed complete! Summary:');
    console.log(`   Doctors:       ${doctors.length}`);
    console.log(`   Patients:      ${patientUsers.length}`);
    console.log(`   Appointments:  ${appointmentCount}`);
    console.log('\n📋 Test login credentials:');
    console.log('   Doctor:  doctor1@test.com / Test1234!');
    console.log('   Patient: patient1@test.com / Test1234!');
    console.log('   (All test accounts use the same password)');

    await mongoose.disconnect();
    process.exit(0);
}

seed().catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
