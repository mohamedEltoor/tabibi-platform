const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@sass.com' });
        if (existingAdmin) {
            console.log('Admin user already exists');
            console.log('Email: admin@sass.com');
            console.log('Password: (already set)');
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        const adminUser = new User({
            name: 'System Admin',
            email: 'admin@sass.com',
            password: hashedPassword,
            role: 'admin',
            // required fields for validations if any, though admin might have fewer strict requirements
            // adding dummy data just in case
            phone: '00000000000',
            governorate: 'Cairo',
            city: 'Cairo',
            address: 'Admin HQ'
        });

        await adminUser.save();
        console.log('Admin user created successfully');
        console.log('Email: admin@sass.com');
        console.log('Password: admin123');

        process.exit(0);
    } catch (err) {
        console.error('Error creating admin:', err);
        process.exit(1);
    }
};

createAdmin();
