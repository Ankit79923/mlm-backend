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
        console.log('verifyToken Done');
        
        next();
    }catch(err){
        res.status(401).json({ error: 'Session Expired. Please Login again.' });
    }
}


// Admin Middleware
// const isAdminMiddleware = (req, res, next) => {
//     try {
//         const token = req.headers.authorization.split(' ')[1];
//         if(!token) return res.status(401).json({ message: "Access Denied: Please Login." });

//         const decoded = jwt.verify(token, secret);
//         if (decoded.role !== 'admin') {
//             return res.status(403).json({ message: "Access Denied: You are not authorized." });
//         }

//         // If user is admin, allow access
//         req.userPayload = decoded;
//         next(); // Continue to the next middleware/route handler
//     } catch (error) {
//         console.log(error);
//         return res.status(401).json({ message: "Invalid token.", error: error.message });
//     }
// };

const isAdminMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // Check if Authorization header exists
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "Access Denied: No token provided. please login" });
        }

        const token = authHeader.split(' ')[1]; // Extract token

        // Validate token
        const decoded = jwt.verify(token, secret);

        // Ensure user is admin
        if (decoded.role !== 'admin') {
            return res.status(401).json({ message: "Access Denied: You are not authorized." });
        }

        req.userPayload = decoded; // Attach decoded token data to request
        next();
    } catch (error) {
        console.error("Auth Error:", error);

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token format.", error: error.message });
        } else if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired. Please login again." });
        }

        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};





// Franchise Middleware
const isFranchiseMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        if(!token) return res.status(401).json({ message: "Access Denied: Please Login." });

        const decoded = jwt.verify(token, secret);
        if (decoded.role !== 'franchise') {
            return res.status(403).json({ message: "Access Denied: You are not authorized." });
        }

        // If user is franchise, allow access
        req.userPayload = decoded;
        next(); // Continue to the next middleware/route handler
    } catch (error) {
        return res.status(401).json({ message: "Invalid token.", error: error.message });
    }
};




module.exports = {
    generateToken,
    verifyTokenMiddleware,
    isAdminMiddleware,
    isFranchiseMiddleware
};

