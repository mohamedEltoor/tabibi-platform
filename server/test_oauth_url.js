require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const strategy = new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    },
    () => { }
);

// Manually trigger the redirect to see the URL
strategy.authenticate({
    _options: { scope: ['profile', 'email'] }
}, {
    redirect: (url) => {
        console.log('Generated Google OAuth URL:');
        console.log(url);
        process.exit(0);
    },
    setHeader: () => { },
    end: () => { }
});
