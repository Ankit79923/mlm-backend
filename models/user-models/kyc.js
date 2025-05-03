const mongoose = require('mongoose');


const kycSchema = mongoose.Schema({
    userDetails: {
        mySponsorId: {
            type: String,
            required: true
           
        },
        name: {
            type: String,
            required: true
        },
        mobileNumber: {
            type: Number,
            required: true
        }
    },
    bankDetaills: {
        bankName : {
            type: String,
            required: true
        },
        branchName: {
            type: String,
            required: true
        },
        accountNumber : {
            type: String,
            required: true
        },
        ifscCode : {
            type: String,
            required: true
        },
        panCard : {
            type: String,
            required: true
        },
        aadharCard : {
            type: String,
            required: true
        }
    },
    documents: {
        panCardFront: {
            type: String, // Store the path or URL of the uploaded image
            required: true
        },
        aadharCardFront: {
            type: String,
            required: true
        },
        aadharCardBack: {
            type: String, 
            required: true
        },
        bankCard: {
            type: String, 
            required: true
        },
        profilephoto: {
            type: String          
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    kycApproved: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    }
});




const KYC = mongoose.model('KYC', kycSchema);
module.exports = KYC;