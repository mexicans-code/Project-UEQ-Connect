import multer from 'multer';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const storage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => {
        const url = req.originalUrl; // ← más confiable que baseUrl + path
        console.log('📁 [Cloudinary] originalUrl:', url);
        console.log('📁 [Cloudinary] baseUrl:', req.baseUrl);
        console.log('📁 [Cloudinary] path:', req.path);
        let folder = 'uteq/destinos';
        if (url.includes('/events'))
            folder = 'uteq/events';
        else if (url.includes('/espacios'))
            folder = 'uteq/espacios';
        else if (url.includes('/personal'))
            folder = 'uteq/personal';
        else if (url.includes('/users'))
            folder = 'uteq/users';
        else if (url.includes('/locations'))
            folder = 'uteq/locations';
        console.log('📂 [Cloudinary] folder elegido:', folder);
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        return {
            folder,
            public_id: uniqueName,
            allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
            transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        };
    },
});
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    console.log('🖼️  [Cloudinary] archivo:', file.originalname, '| mimetype:', file.mimetype, '| válido:', mimetype && extname);
    if (mimetype && extname) {
        cb(null, true);
    }
    else {
        cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
    }
};
export const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter,
});
export { cloudinary };
