import multer from "multer";
import path from "path";
import fs from "fs";

const createUploader = ({ folder, allowedTypes }) => {
    const uploadDir = `uploads/${folder}`;

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const storage = multer.diskStorage({
        destination: (req, file, cb) => { cb(null, uploadDir) },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
            cb(null, name);
        },
    });

    return multer({
        storage,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
        fileFilter: (req, file, cb) => {
            if (!allowedTypes.includes(file.mimetype)) {
                cb(new Error("Invalid file type"));
            } else {
                cb(null, true);
            }
        },
    });
};

export default createUploader;