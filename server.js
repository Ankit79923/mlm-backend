const express = require('express');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const db = require('./config/db_connection');
const client = require('./config/redis');
const path = require('path');
const cron = require('node-cron');
const { calculateWeekelyPayout, calculateMonthlyPayout } = require('./utils/calculatePayout');
const PORT = process.env.PORT || 3000;


const app = express();
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public')));



// Calculating weekly payouts - on every saturday 12:00 AM
cron.schedule('0 0 * * 6', () => { 
    console.log('Running function to calculate weekly payout'); 
    calculateWeekelyPayout(); 
}, { scheduled: true, timezone: "IST" });


// calculate mothly payouts - on 1st of every month
cron.schedule('0 0 1 * *', () => { 
    console.log('Running function to calculate monthly payout'); 
    calculateMonthlyPayout(); 
}, { scheduled: true, timezone: "IST" });



// cron.schedule('* * * * *', () => { 
//     console.log('Running function to calculate monthly payout'); 
//     calculateMonthlyPayout(); 
// }, { scheduled: true, timezone: "IST" });

// cron.schedule('* * * * *', () => { 
//     console.log('Running function to calculate weekly payout'); 
//     calculateWeekelyPayout(); 
// }, { scheduled: true, timezone: "IST" });




// routes
const authRoutes = require('./routes/authRoute');
const adminRoutes = require('./routes/adminRoute');
const userRoutes = require('./routes/userRoute');
const franchiseRoutes = require('./routes/franchiseRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/franchise', franchiseRoutes);


app.listen(PORT);