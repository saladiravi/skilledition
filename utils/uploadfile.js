const path = require('path');
const multer = require('multer');
const fs = require('fs');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Store files in the 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);  
  }
});

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'video/mp4',
  'video/mpeg',
  'video/ogg',
  'video/webm',
  'video/quicktime',
  'application/pdf', // ✅ PDF
  'application/msword', // ✅ .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // ✅ .docx
  'application/vnd.ms-excel', // ✅ .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // ✅ .xlsx

];

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Only image and video files are allowed!'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 1000 * 1024 * 1024 // optional: limit to 100 MB
  }
});




 
module.exports = upload;

