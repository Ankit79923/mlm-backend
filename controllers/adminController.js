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
        const today = moment().startOf("day");
        console.log("Fetching all orders for purchase statistics...");
        // Fetch all orders sorted by date
        const allOrders = await UserOrder.find().sort({ "orderDetails.orderDate": 1 });
        // Function to format month, week, and day names
        const formatMonth = (date) => moment(date).format("MMMM YYYY");
        const formatDay = (date) => moment(date).format("dddd, YYYY-MM-DD");
        let monthlyStats = {};
        // Initialize total calculations
        let dailyTotal = 0, weeklyTotal = 0, monthlyTotal = 0, overallTotal = 0;
        allOrders.forEach(order => {
            const orderDate = moment(order.orderDetails.orderDate);
            const monthKey = formatMonth(orderDate);
            // Initialize month if not exists
            if (!monthlyStats[monthKey]) {
                monthlyStats[monthKey] = {
                    totalAmount: 0,
                    weeks: {}
                };
            }
            // Find the correct week (Monday to Sunday)
            let weekStart = moment(orderDate).startOf("week"); // Monday
            let weekEnd = moment(weekStart).add(6, "days"); // Sunday
            // Ensure full week stays in the month it ends in
            if (weekEnd.month() !== orderDate.month()) {
                weekStart = moment(weekEnd).startOf("week"); // Adjust to keep whole week in one month
            }
            const weekKey = `Week (${weekStart.format("YYYY-MM-DD")} - ${weekEnd.format("YYYY-MM-DD")})`;
            // Ensure the week belongs only to the current month
            if (!monthlyStats[monthKey].weeks[weekKey]) {
                monthlyStats[monthKey].weeks[weekKey] = {
                    totalAmount: 0,
                    days: {}
                };
                // Initialize all 7 days in the week with 0
                for (let i = 0; i < 7; i++) {
                    const dayDate = moment(weekStart).add(i, "days");
                    const dayKey = formatDay(dayDate);
                    monthlyStats[monthKey].weeks[weekKey].days[dayKey] = 0;
                }
            }
            // Format day key
            const dayKey = formatDay(orderDate);
            // Add totalAmount
            const totalAmount = order.orderDetails.totalAmount;
            monthlyStats[monthKey].totalAmount += totalAmount;
            monthlyStats[monthKey].weeks[weekKey].totalAmount += totalAmount;
            monthlyStats[monthKey].weeks[weekKey].days[dayKey] += totalAmount;
            // Aggregate totals
            overallTotal += totalAmount;
            if (orderDate.isSame(today, "day")) dailyTotal += totalAmount;
            if (orderDate.isSame(today, "week")) weeklyTotal += totalAmount;
            if (orderDate.isSame(today, "month")) monthlyTotal += totalAmount;
        });
        console.log("Purchase stats calculated successfully.");
        res.json({
            success: true,
            dailyTotal,
            weeklyTotal,
            monthlyTotal,
            overallTotal,
            monthlyStats
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