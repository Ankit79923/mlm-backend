const Admin = require('../models/admin-models/admin');
const { generateToken, verifyTokenMiddleware, isAdminMiddleware } = require('../middlewares/jwt');
const User = require('../models/user-models/users');
const Kyc = require('../models/user-models/kyc');

// Create a new Admin
async function handleCreateAdmin(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) { return res.status(400).json({ message: 'Please provide both email and password' }); }

        // check if user already exists
        let user = await Admin.findOne({ email: email });
        if (user) { return res.status(404).json({ message: 'Email already registered' }); };
        
        // create new user
        const newUser = await Admin.create({ email: email, password: password });
        res.json({ message: 'Admin created successfully', newUser });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


// Admin Login
async function handleAdminLogin(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) { return res.status(400).json({ message: 'Please provide email and password' }); }

        let user = await Admin.findOne({ email: email });
        if (!user) { return res.status(404).json({ message: 'User not found' }); }
        

        const isPasswordMatch = await user.comparePassword(password);
        if (isPasswordMatch) {
            const payload = { email: user.email, id: user._id, role: 'admin' };
            const token = generateToken(payload);
            res.json({ token });
        } else {
            res.status(404).json({ message: 'Incorrect email OR password.' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
//active with kyc
const activeWithKyc = async (req, res) => {
    try {
        const activeUsers = await User.find({ isActive: true }); // Get active users
        // Extract mySponsorIds of active users
        const sponsorIds = activeUsers.map(user => user.mySponsorId);
        // Find verified KYC records that match the active users' mySponsorIds
        const verifiedKycs = await Kyc.find({
            "userDetails.mySponsorId": { $in: sponsorIds },
            kycApproved: "verified"
        });
        // Extract mySponsorIds of users who are KYC verified
        const verifiedSponsorIds = verifiedKycs.map(kyc => kyc.userDetails.mySponsorId);
        // Filter active users to return only those whose KYC is verified
        const filteredUsers = activeUsers.filter(user => verifiedSponsorIds.includes(user.mySponsorId));
        return res.status(200).json(filteredUsers);
    } catch (error) {
        console.error('Error fetching active users with verified KYC:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
const activeWithNoKyc = async (req, res) => {
    try {
        const activeUsers = await User.find({ isActive: true }); // Get active users
        // Extract mySponsorIds of active users
        const sponsorIds = activeUsers.map(user => user.mySponsorId);
        // Find verified KYC records that match the active users' mySponsorIds
        const verifiedKycs = await Kyc.find({
            "userDetails.mySponsorId": { $in: sponsorIds },
            kycApproved: "pending"
        });
        // Extract mySponsorIds of users who are KYC verified
        const verifiedSponsorIds = verifiedKycs.map(kyc => kyc.userDetails.mySponsorId);
        // Filter active users to return only those whose KYC is verified
        const filteredUsers = activeUsers.filter(user => verifiedSponsorIds.includes(user.mySponsorId));
        return res.status(200).json(filteredUsers);
    } catch (error) {
        console.error('Error fetching active users with verified KYC:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
//inactive with kyc
const inactiveWithKyc = async (req, res) => {
    try {
        const activeUsers = await User.find({ isActive: false }); // Get active users
        // Extract mySponsorIds of active users
        const sponsorIds = activeUsers.map(user => user.mySponsorId);
        // Find verified KYC records that match the active users' mySponsorIds
        const verifiedKycs = await Kyc.find({
            "userDetails.mySponsorId": { $in: sponsorIds },
            kycApproved: "verified"
        });
        // Extract mySponsorIds of users who are KYC verified
        const verifiedSponsorIds = verifiedKycs.map(kyc => kyc.userDetails.mySponsorId);
        // Filter active users to return only those whose KYC is verified
        const filteredUsers = activeUsers.filter(user => verifiedSponsorIds.includes(user.mySponsorId));
        return res.status(200).json(filteredUsers);
    } catch (error) {
        console.error('Error fetching active users with verified KYC:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
const inactiveWithNoKyc = async (req, res) => {
    try {
        const activeUsers = await User.find({ isActive: false }); // Get active users
        // Extract mySponsorIds of active users
        const sponsorIds = activeUsers.map(user => user.mySponsorId);
        // Find verified KYC records that match the active users' mySponsorIds
        const verifiedKycs = await Kyc.find({
            "userDetails.mySponsorId": { $in: sponsorIds },
            kycApproved: "pending"
        });
        // Extract mySponsorIds of users who are KYC verified
        const verifiedSponsorIds = verifiedKycs.map(kyc => kyc.userDetails.mySponsorId);
        // Filter active users to return only those whose KYC is verified
        const filteredUsers = activeUsers.filter(user => verifiedSponsorIds.includes(user.mySponsorId));
        return res.status(200).json(filteredUsers);
    } catch (error) {
        console.error('Error fetching active users with verified KYC:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};









module.exports = {
    handleCreateAdmin,
    handleAdminLogin,
    activeWithKyc,
    activeWithNoKyc,
    inactiveWithKyc,
    inactiveWithNoKyc

}