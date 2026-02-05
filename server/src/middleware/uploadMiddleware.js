const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Configure Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

let storage;

// For Supabase, we'll use memoryStorage for cloud uploads 
// and then upload in the controller to get the public URL.
if (process.env.SUPABASE_URL) {
    storage = multer.memoryStorage();
} else {
    // Development: Use Local Storage
    const fs = require('fs');
    const uploadDir = 'uploads/emr';
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    });
}

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only images (jpg, png, webp) and PDFs are allowed'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter
});

module.exports = { upload, supabase };
