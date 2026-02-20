const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'tabibi',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'pdf'],
        resource_type: 'auto', // Important for PDF support
        public_id: (req, file) => {
            try {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const cleanName = file.originalname ? file.originalname.split('.')[0].replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'file';
                return `${cleanName}-${uniqueSuffix}`;
            } catch (err) {
                console.error('Error in public_id generator:', err);
                return `file-${Date.now()}`;
            }
        },
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

module.exports = { upload, cloudinary };
