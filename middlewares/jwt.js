const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;


// generateToken
const generateToken = function(payload){
    const token = jwt.sign(payload, secret);
    return token;
};


// verifyToken
const verifyTokenMiddleware = function(req, res, next){
    try{
        const token = req.headers.authorization.split(' ')[1];
        if(!token) return res.status(401).json({error: 'Session expired'});

        const decoded = jwt.verify(token, secret);
        req.userPayload = decoded,
        next();
    }catch(err){
        res.status(401).json({ error: 'Session Expired. Please Login again.' });
    }
}


// Admin Middleware
const isAdminMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        if(!token) return res.status(401).json({ message: "Access Denied: Please Login." });

        const decoded = jwt.verify(token, secret);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: "Access Denied: You are not authorized." });
        }

        // If user is admin, allow access
        req.userPayload = decoded;
        next(); // Continue to the next middleware/route handler
    } catch (error) {
        return res.status(401).json({ message: "Invalid token.", error: error.message });
    }
};




module.exports = {
    generateToken,
    verifyTokenMiddleware,
    isAdminMiddleware
};

