const Admin = require('../models/admin-models/admin');
const { generateToken, verifyTokenMiddleware, isAdminMiddleware } = require('../middlewares/jwt');
const User = require('../models/user-models/users');
const Kyc = require('../models/user-models/kyc');
const UserOrder = require('../models/user-models/userOrders');
const moment = require('moment');
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
        // Find all users who have a KYC record
        const usersWithKyc = await Kyc.find({ "userDetails.mySponsorId": { $in: sponsorIds } });
        // Extract mySponsorIds of users who already have a KYC record
        const usersWithKycSponsorIds = usersWithKyc.map(kyc => kyc.userDetails.mySponsorId);
        // Filter active users who DO NOT have a KYC record
        const filteredUsers = activeUsers.filter(user => !usersWithKycSponsorIds.includes(user.mySponsorId));
        return res.status(200).json(filteredUsers);
    } catch (error) {
        console.error('Error fetching active users without KYC:', error);
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
        // Get all inactive users
        const inactiveUsers = await User.find({ isActive: false });
        // Extract mySponsorIds of inactive users
        const sponsorIds = inactiveUsers.map(user => user.mySponsorId);
        // Find users who have a KYC record
        const usersWithKyc = await Kyc.find({ "userDetails.mySponsorId": { $in: sponsorIds } });
        // Extract mySponsorIds of users who already have a KYC record
        const usersWithKycSponsorIds = usersWithKyc.map(kyc => kyc.userDetails.mySponsorId);
        // Filter inactive users who DO NOT have a KYC record
        const filteredUsers = inactiveUsers.filter(user => !usersWithKycSponsorIds.includes(user.mySponsorId));
        return res.status(200).json(filteredUsers);
    } catch (error) {
        console.error('Error fetching inactive users without KYC:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

const activeuser = async (req, res) => {
    // try {
    //     const activeUsers = await User.find({ isActive: true }); 
    //     return res.status(200).json(activeUsers);
    try {
        const activeUsers = await User.find({ isActive: true });

        const usersWithLastOrderDate = await Promise.all(activeUsers.map(async (user) => {
            const lastOrder = await UserOrder.findOne({ 'userDetails.user': user._id })
                .sort({ 'orderDetails.orderDate': -1 })
                .select('orderDetails.orderDate');
            
            return {
                ...user.toObject(),
                lastOrderDate: lastOrder ? new Date(lastOrder.orderDetails.orderDate).toISOString().split('T')[0] : null,
            };
        }));

        return res.status(200).json(usersWithLastOrderDate);
    } catch (error) {
        console.error('Error fetching active users :', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
////ORDERS AMOUNT TODAY, WEEKLY,MONTHLY
const calculatePurchaseStats = async (req, res) => {
    try {
        const today = moment().startOf("day"); // Start of today
        const startOfWeek = moment().startOf("week"); // Start of the current week (Sunday)
        const startOfMonth = moment().startOf("month"); // Start of the current month
        console.log("Fetching orders for daily, weekly, monthly, and total calculations...");
        // Fetch orders for today
        const dailyOrders = await UserOrder.find({
            "orderDetails.orderDate": { $gte: today.toDate() },
        });
        // Fetch orders for this week
        const weeklyOrders = await UserOrder.find({
            "orderDetails.orderDate": { $gte: startOfWeek.toDate() },
        });
        // Fetch orders for this month
        const monthlyOrders = await UserOrder.find({
            "orderDetails.orderDate": { $gte: startOfMonth.toDate() },
        });
        // Fetch all-time total orders
        const totalOrders = await UserOrder.find();
        // Calculate totalAmount for each period
        const calculateTotalAmount = (orders) =>
            orders.reduce((sum, order) => sum + order.orderDetails.totalAmount, 0);
        const dailyTotal = calculateTotalAmount(dailyOrders);
        const weeklyTotal = calculateTotalAmount(weeklyOrders);
        const monthlyTotal = calculateTotalAmount(monthlyOrders);
        const overallTotal = calculateTotalAmount(totalOrders);
        // Console logs for debugging
        console.log(`Daily Total (${today.format("YYYY-MM-DD")}): ${dailyTotal}`);
        console.log(`Weekly Total (from ${startOfWeek.format("YYYY-MM-DD")}): ${weeklyTotal}`);
        console.log(`Monthly Total (from ${startOfMonth.format("YYYY-MM-DD")}): ${monthlyTotal}`);
        console.log(`Overall Total: ${overallTotal}`);
        // Check for empty orders
        if (dailyOrders.length === 0) console.log("No purchases made today.");
        if (weeklyOrders.length === 0) console.log("No purchases made this week.");
        if (monthlyOrders.length === 0) console.log("No purchases made this month.");
        if (totalOrders.length === 0) console.log("No purchases recorded.");
        res.json({
            success: true,
            dailyTotal,
            weeklyTotal,
            monthlyTotal,
            overallTotal,
        });
    } catch (error) {
        console.error("Error calculating purchases:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};







module.exports = {
    handleCreateAdmin,
    handleAdminLogin,
    activeWithKyc,
    activeWithNoKyc,
    inactiveWithKyc,
    inactiveWithNoKyc,
    activeuser,
    calculatePurchaseStats

}