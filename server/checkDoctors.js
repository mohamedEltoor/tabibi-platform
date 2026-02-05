const mongoose = require('mongoose');
require('dotenv').config();

const Doctor = require('./src/models/Doctor');
const User = require('./src/models/User');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('✅ متصل بقاعدة البيانات');

        const doctors = await Doctor.find().populate('user');

        console.log('\n📊 عدد الدكاترة المسجلين:', doctors.length);
        console.log('\n' + '='.repeat(80));

        if (doctors.length === 0) {
            console.log('❌ لا يوجد دكاترة مسجلين في قاعدة البيانات');
        } else {
            doctors.forEach((doc, index) => {
                console.log(`\n👨‍⚕️ دكتور ${index + 1}:`);
                console.log('  - الاسم:', doc.user?.name || 'غير متوفر');
                console.log('  - البريد الإلكتروني:', doc.user?.email || 'غير متوفر');
                console.log('  - التخصص:', doc.specialty || 'غير متوفر');
                console.log('  - المحافظة:', doc.user?.governorate || 'غير متوفر');
                console.log('  - المدينة:', doc.user?.city || 'غير متوفر');
                console.log('  - رقم الهاتف:', doc.user?.phone || 'غير متوفر');
                console.log('  - سعر الكشف:', doc.pricing?.consultationFee || 'غير متوفر', 'ج.م');
                console.log('  - التقييم:', doc.rating || 'لا يوجد');
                console.log('  - ID:', doc._id);
                console.log('  ' + '-'.repeat(70));
            });
        }

        console.log('\n' + '='.repeat(80));

        // عرض إحصائيات إضافية
        const users = await User.find();
        console.log('\n📊 إحصائيات عامة:');
        console.log('  - إجمالي المستخدمين:', users.length);
        console.log('  - الدكاترة:', doctors.length);
        console.log('  - المرضى:', users.filter(u => u.role === 'patient').length);
        console.log('  - الأدمن:', users.filter(u => u.role === 'admin').length);

        mongoose.connection.close();
        console.log('\n✅ تم إغلاق الاتصال بقاعدة البيانات');
    })
    .catch(err => {
        console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err.message);
        process.exit(1);
    });
