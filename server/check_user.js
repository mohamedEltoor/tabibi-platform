require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const checkUser = async (email) => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to database\n');

        const user = await User.findOne({ email });

        if (!user) {
            console.log(`❌ User with email ${email} not found`);
        } else {
            console.log(`📧 User Details:`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Name: ${user.name}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   GoogleID: ${user.googleId || 'N/A'}`);
            console.log(`   Auth Provider: ${user.authProvider}`);
            console.log(`   Email Verified: ${user.isEmailVerified}`);
            console.log(`   Created At: ${user.createdAt}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

const email = process.argv[2] || 'rabeaeltur@gmail.com';
checkUser(email);
