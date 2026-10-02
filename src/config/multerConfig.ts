import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary';

// Configure how and where files should be stored
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        // Check if the uploaded file is an image
        const isImage = file.mimetype.startsWith('image/');

        if (isImage) {
            return {
                folder: 'chat_attachments',
                resource_type: 'image',
                allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
                transformation: [{ width: 800, height: 800, crop: 'limit' }],
            };
        } else {
            return {
                folder: 'chat_attachments',
                resource_type: 'auto', 
                // We omit public_id and format so Cloudinary stores it as an opaque blob
                // This bypasses the 401 Untrusted error for PDFs on the free tier!
            };
        }
    },
});

// Initialize multer with the storage configuration
const upload = multer({ storage: storage });

export default upload;