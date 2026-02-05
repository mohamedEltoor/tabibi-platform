const axios = require('axios');

async function testRegistration() {
    try {
        console.log('Testing doctor registration...\n');

        const response = await axios.post('http://localhost:5000/api/auth/register', {
            name: 'د. محمد أحمد',
            email: 'test.doctor@example.com',
            password: 'test123456',
            role: 'doctor',
            phone: '01012345678',
            governorate: 'القاهرة',
            city: 'مدينة نصر',
            address: '15 شارع عباس العقاد'
        });

        console.log('✅ Registration successful!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log('❌ Registration failed!');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Error:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }
    }
}

testRegistration();
