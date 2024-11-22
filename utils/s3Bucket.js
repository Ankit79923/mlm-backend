const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');



// S3 Client Setup
const s3Client = new S3Client({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: 'AKIAYZZGTJ7W5LWVA7XK',
        secretAccessKey: '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',
    },
});



module.exports = {
    s3Client,
    PutObjectCommand
}