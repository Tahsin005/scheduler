import multer from "multer";

const storage = multer.memoryStorage();

export const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) => {
        cb(null, /^(image|video)\//.test(file.mimetype));
    },
});
