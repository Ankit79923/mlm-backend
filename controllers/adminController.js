const Admin = require('../models/admin-models/admin');
const { generateToken, verifyTokenMiddleware, isAdminMiddleware } = require('../middlewares/jwt');


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








module.exports = {
    handleCreateAdmin,
    handleAdminLogin
}