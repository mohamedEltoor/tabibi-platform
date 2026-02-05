const mongoose = require('mongoose');
require('dotenv').config();

const Doctor = require('./src/models/Doctor');
const User = require('./src/models/User');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('✅ متصل بقاعدة البيانات');
        console.log('\n' + '='.repeat(80));

        // Find all users with role "doctor"
        const doctorUsers = await User.find({ role: 'doctor' });
        console.log(`\n📊 عدد المستخدمين بدور "دكتور": ${doctorUsers.length}`);

        let createdCount = 0;
        let existingCount = 0;
        let errorCount = 0;

        for (const user of doctorUsers) {
            try {
                // Check if doctor profile already exists
                const existingDoctor = await Doctor.findOne({ user: user._id });

                if (existingDoctor) {
                    console.log(`✓ الدكتور ${user.name} (${user.email}) - البروفايل موجود بالفعل`);
                    existingCount++;
                } else {
                    // Create doctor profile
                    const doctor = new Doctor({
                        user: user._id,
                        specialty: 'عام', // Default specialty
                        bio: '',
                        pricing: {
                            consultationFee: 0,
                            currency: 'EGP'
                        },
                        availability: []
                    });

                    await doctor.save();
                    console.log(`✅ تم إنشاء بروفايل للدكتور ${user.name} (${user.email})`);
                    createdCount++;
                }
            } catch (err) {
                console.error(`❌ خطأ في معالجة الدكتور ${user.name} (${user.email}):`, err.message);
                errorCount++;
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log('\n📊 ملخص العملية:');
        console.log(`  - إجمالي الدكاترة: ${doctorUsers.length}`);
        console.log(`  - البروفايلات الموجودة مسبقاً: ${existingCount}`);
        console.log(`  - البروفايلات المنشأة: ${createdCount}`);
        console.log(`  - الأخطاء: ${errorCount}`);

        // Verify final state
        const allDoctors = await Doctor.find().populate('user');
        console.log(`\n✅ إجمالي بروفايلات الدكاترة في قاعدة البيانات: ${allDoctors.length}`);

        mongoose.connection.close();
        console.log('\n✅ تم إغلاق الاتصال بقاعدة البيانات');
    })
    .catch(err => {
        console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err.message);
        process.exit(1);
    });
