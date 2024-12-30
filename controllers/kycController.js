const KYC = require('../models/user-models/kyc');
const { s3Client, PutObjectCommand } = require('../utils/s3Bucket');



// 1. Submit KYC details
// const handleSubmitKycDetails = async (req, res) => {
//   try {
//     // Get form data from the request body
//     const { mySponsorId, name, mobileNumber, bankName, branchoName, accountNumber, ifscCode, panCard, aadharCard } = req.body;

//     if (!mySponsorId || !name || !mobileNumber || !bankName || !branchName || !accountNumber || !ifscCode || !panCard || !aadharCard) {
//       return res.status(400).json({ message: 'All fields are required. Please fill all the fields.' });
//     }

   


//     // Upload documents to S3 bucket
//     const files = req.files;
//     if (!files || !files.panCardFront || !files.aadharCardFront || !files.aadharCardBack || !files.bankCard) {
//       return res.status(400).json({ message: 'All document images are required.' });
//     }

//     const uploadToS3 = async (file, keyPrefix) => {
//       const params = {
//         Bucket: 'mlm-assets-bucket',
//         Key: `${keyPrefix}/${Date.now()}_${file.originalname}`,
//         Body: file.buffer,
//         ContentType: file.mimetype,
//       };
//       await s3Client.send(new PutObjectCommand(params));
//       return `https://${params.Bucket}.s3.ap-south-1.amazonaws.com/${params.Key}`;
//     };

//     // Upload documents to S3
//     const panCardFrontUrl = await uploadToS3(files.panCardFront[0], 'user-documents');
//     const aadharCardFrontUrl = await uploadToS3(files.aadharCardFront[0], 'user-documents');
//     const aadharCardBackUrl = await uploadToS3(files.aadharCardBack[0], 'user-documents');
//     const bankCardUrl = await uploadToS3(files.bankCard[0], 'user-documents');

//     // Create a new KYC document
//     const kyc = new KYC({
//       userDetails: {
//         mySponsorId,
//         name,
//         mobileNumber
//       },
//       bankDetaills: {
//         bankName,
//         branchName,
//         accountNumber,
//         ifscCode,
//         panCard,
//         aadharCard
//       },
//       documents: {
//         panCardFront: panCardFrontUrl,
//         aadharCardFront: aadharCardFrontUrl,
//         aadharCardBack: aadharCardBackUrl,
//         bankCard: bankCardUrl,
//       }
//     });

//     // Save the document to MongoDB
//     await kyc.save();

//     // Send success response
//     res.status(201).json({ message: 'KYC submitted successfully', kyc });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

const handleSubmitKycDetails = async (req, res) => {
  try {
    const { mySponsorId, name, mobileNumber, bankName, branchName, accountNumber, ifscCode, panCard, aadharCard} = req.body;

    if (!mySponsorId || !name || !mobileNumber || !bankName || !branchName || !accountNumber || !ifscCode || !panCard || !aadharCard) {
      return res.status(400).json({ message: 'All fields are required. Please fill all the fields.' });
    }

    // Find the existing KYC document
    const existingKYC = await KYC.findOne({ 'userDetails.mySponsorId': mySponsorId });

    // Upload documents to S3 bucket
    const files = req.files;
    if (!files || !files.panCardFront || !files.aadharCardFront || !files.aadharCardBack || !files.bankCard || !files.profilephoto) {
      return res.status(400).json({ message: 'All document images are required.' });
    }

    const uploadToS3 = async (file, keyPrefix) => {
      const params = {
        Bucket: 'mlm-assets-bucket',
        Key: `${keyPrefix}/${Date.now()}_${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      };
      await s3Client.send(new PutObjectCommand(params));
      return `https://${params.Bucket}.s3.ap-south-1.amazonaws.com/${params.Key}`;
    };

    const panCardFrontUrl = await uploadToS3(files.panCardFront[0], 'user-documents');
    const aadharCardFrontUrl = await uploadToS3(files.aadharCardFront[0], 'user-documents');
    const aadharCardBackUrl = await uploadToS3(files.aadharCardBack[0], 'user-documents');
    const bankCardUrl = await uploadToS3(files.bankCard[0], 'user-documents');
    const profilephotoUrl = await uploadToS3(files.profilephoto[0], 'user-documents');

    if (existingKYC) {
      // Update the existing KYC document
      existingKYC.userDetails = { mySponsorId, name, mobileNumber };
      existingKYC.bankDetaills = { bankName, branchName, accountNumber, ifscCode, panCard, aadharCard };
      existingKYC.documents = {
        panCardFront: panCardFrontUrl,
        aadharCardFront: aadharCardFrontUrl,
        aadharCardBack: aadharCardBackUrl,
        bankCard: bankCardUrl,
        profilephoto: profilephotoUrl,
      };
      existingKYC.kycApproved = 'pending'; // Reset approval status to pending
      await existingKYC.save();
    } else {
      // Create a new KYC document
      const kyc = new KYC({
        userDetails: { mySponsorId, name, mobileNumber },
        bankDetaills: { bankName, branchName, accountNumber, ifscCode, panCard, aadharCard },
        documents: {
          panCardFront: panCardFrontUrl,
          aadharCardFront: aadharCardFrontUrl,
          aadharCardBack: aadharCardBackUrl,
          bankCard: bankCardUrl,
          profilephoto: profilephotoUrl,
        },
        kycApproved: 'pending',
      });
      await kyc.save();
    }

    return res.status(201).json({ message: 'KYC submitted successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// 2. Admin will Verify KYC user
const handleVerifyKYCDetails = async (req, res) => {
  try {
    const { mySponsorId } = req.body;
    if (!mySponsorId) { return res.status(400).json({ message: 'mySponsorId is missing.' }); }

    // Find KYC user
    const kyc = await KYC.findOne({ 'userDetails.mySponsorId': mySponsorId });
    if (!kyc) {
      return res.status(404).json({ message: 'KYC details not found.' });
    }

    kyc.kycApproved = 'verified';
    await kyc.save();

    return res.status(200).json({ message: 'KYC details verified successfully.', kyc });
  } catch (error) {
    console.error('Error verifying KYC user:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}


// 3. Admin will Reject KYC user
const handleRejectKYCDetails = async (req, res) => {
  try {
    const { mySponsorId } = req.body;
    if (!mySponsorId) { return res.status(400).json({ message: 'mySponsorId is missing.' }); }

    // Find KYC user
    const kyc = await KYC.findOne({ 'userDetails.mySponsorId': mySponsorId });
    if (!kyc) {
      return res.status(404).json({ message: 'KYC details not found.' });
    }

    kyc.kycApproved = 'rejected';
    await kyc.save();

    return res.status(200).json({ message: 'KYC details rejected successfully.', kyc });
  } catch (error) {
    console.error('Error verifying KYC user:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}


// 4. Admin will Get All the non-verified KYC users
const handleGetAllNonVerifiedKycUsers = async (req, res) => {
  try {
    const users = await KYC.find({ kycApproved: 'pending' });
    return res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching non-verified KYC users:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// 5. Admin will Get All the verified KYC users
const handleGetAllVerifiedKycUsers = async (req, res) => {
  try {
    const users = await KYC.find({ kycApproved: 'verified' });
    return res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching verified KYC users:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}


// 6. API to get KYC status
const handleGetKYCStatus = async (req, res) => {
  try {
    // Extract sponsorId from the request parameters
    const { mySponsorId } = req.params; 

    // Search for KYC details
    const kyc = await KYC.findOne({ 'userDetails.mySponsorId': mySponsorId }); 
    if (!kyc) { return res.json({ kycStatus: 'not_submitted'}); }

    return res.status(200).json( { kycStatus: kyc.kycApproved} );
  } catch (error) {
    console.error(error);
    return res.status(500).json( {message: 'Server error', error: error.message});
  }
}

module.exports = {
  handleSubmitKycDetails,
  handleGetAllNonVerifiedKycUsers,
  handleVerifyKYCDetails,
  handleRejectKYCDetails,
  handleGetAllVerifiedKycUsers,
  handleGetKYCStatus
}