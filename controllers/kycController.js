const KYC = require('../models/user-models/kyc');



// 1. Submit KYC details
const handleSubmitKycDetails = async (req, res) => {
    try {
      // Get form data from the request body
      const { mySponsorId, name, mobileNumber, bankName, branchName, accountNumber, ifscCode, panCard, aadharCard } = req.body;

      if(!mySponsorId || !name || !mobileNumber || !bankName || !branchName || !accountNumber || !ifscCode || !panCard || !aadharCard) {
        return res.status(400).json({ message: 'All fields are required. Please fill all the fields.' });
      }

      // Check if the KYC user already exists in the database
      const existingUser = await KYC.findOne({ 'userDetails.mySponsorId': mySponsorId });
      if (existingUser) {
        return res.status(400).json({ message: 'You have already submitted KYC details.' });
      }
  
      // Create a new KYC document
      const kyc = new KYC({
        userDetails: {
          mySponsorId,
          name,
          mobileNumber
        },
        bankDetaills: {
          bankName,
          branchName,
          accountNumber,
          ifscCode,
          panCard,
          aadharCard
        },
        documents: {
          panCardFront: `${req.protocol}://${req.get('host')}/public/images/uploads/${req.files['panCardFront'][0].filename}`,
          aadharCardFront: `${req.protocol}://${req.get('host')}/public/images/uploads/${req.files['aadharCardFront'][0].filename}`,
          aadharCardBack: `${req.protocol}://${req.get('host')}/public/images/uploads/${req.files['aadharCardBack'][0].filename}`,
          bankCard: `${req.protocol}://${req.get('host')}/public/images/uploads/${req.files['bankCard'][0].filename}`,
        }
      });
  
      // Save the document to MongoDB
      await kyc.save();
  
      // Send success response
      res.status(201).json({ message: 'KYC submitted successfully', kyc });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
};


// 2. Admin will Get All the non-verified KYC users
const handleGetAllNonVerifiedKycUsers = async (req, res) => {
    try {
        const users = await KYC.find({ kycApproved: 'pending' });
        return res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching non-verified KYC users:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}


// 3. Admin will Verify KYC user
const handleVerifyKYCDetails = async (req, res) => {
    try {
        const { mySponsorId } = req.body;
        if(!mySponsorId) { return res.status(400).json({ message: 'mySponsorId is missing.' }); }

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


// 4. Admin will Reject KYC user
const handleRejectKYCDetails = async (req, res) => {
  try {
      const { mySponsorId } = req.body;
      if(!mySponsorId) { return res.status(400).json({ message: 'mySponsorId is missing.' }); }

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



module.exports = {
    handleSubmitKycDetails,
    handleGetAllNonVerifiedKycUsers,
    handleVerifyKYCDetails,
    handleRejectKYCDetails
}