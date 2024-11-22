const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');



// S3 Client Setup
const s3Client = new S3Client({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});



module.exports = {
    s3Client,
    PutObjectCommand
}