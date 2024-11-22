const multer = require('multer');



// Multer Setup for File Uploads
const storage = multer.memoryStorage(); // Stores file in memory for uploading to S3
const upload = multer({ storage });



module.exports = {
    upload
}