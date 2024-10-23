const KYC = require('../models/user-models/kyc');


const handleSubmitKycDetails = async (req, res) => {
    try {
      // Get form data from the request body
      const { mySponsorId, name, mobileNumber, bankName, branchName, accountNumber, ifscCode, panCard, aadharCard } = req.body;
      
      // Get the file paths from Multer
      const panCardFrontPath = req.files['panCardFront'][0].path;
      const aadharCardFrontPath = req.files['aadharCardFront'][0].path;
      const aadharCardBackPath = req.files['aadharCardBack'][0].path;
      const bankCardPath = req.files['bankCard'][0].path;
  
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
          panCardFront: panCardFrontPath,
          aadharCardFront: aadharCardFrontPath,
          aadharCardBack: aadharCardBackPath,
          bankCard: bankCardPath,
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



module.exports = {
    handleSubmitKycDetails
}