const User = require('../models/user-models/users');
const { findPositionAndAttach, placeInLeftSideOfTree, placeInRightSideOfTree } = require('../utils/placeInBinaryTree');
const { generateToken, verifyTokenMiddleware } = require('../middlewares/jwt');
const generateUniqueSponsorID = require('../utils/generateUniqueSponsorId');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');


//node mailer for sending mail after registration
const transporter = nodemailer.createTransport({
    // service: 'gmail',
     host: 'email-smtp.us-east-1.amazonaws.com',            // Replace with your actual SMTP host
     port: 465,                                      // Use 587 for TLS or 465 for SSL (verify with your provider)
     secure: true, 
    auth: {
        user: 'AKIAYZZGTJ7W67TEQ3GJ', // Replace with your email
        pass: 'BDsTltRO/wAeyKjq7WLc2ipdscnrSV6rYrbKtLnrIwVh',  // Replace with your email password or app-specific password
    },
});

   

// Function to send email
async function sendMail(user) {
    console.log('2. Inside sendMail function');
    const subject = 'Welcome to Udbhab Marketing Private Limited! Your Journey Starts Here';
    const html = `
        <p>Dear ${user.name},</p>
        <p>Welcome to Udbhab! We’re excited to have you onboard and look forward to being part of your journey.</p>
        <p>Here’s your login information to get started:</p>
        <p><strong>User ID:</strong> ${user.mySponsorId}</p>
        <p>Use this ID to access your account or share it with others as needed.</p>
        <p>Need help?<br/>
         We’re here for you every step of the way. Contact our support team anytime at support@myudbhab.in or 7980964516.<br/>

        Thank you for choosing Udbhab. Let’s achieve great things together!</p>
        <p>Best regards,<br>MyUdbhab Team</p>
    `;
    console.log('3. Inside sendMail function',html);
    const mailOptions = {
        from: 'info@myudbhab.in', // Replace with your email
        to: user.email,
        subject,
        html,
    };

    try {
        // await transporter.sendMail(mailOptions);
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error: ', error);
            } else {
                console.log('Message sent: ', info.response);
            }
        })
        console.log('Email sent successfully!');
        return 'sent';

         
    } catch (error) {
        console.error('Error sending email:', error.message);
        return 'error';
    }
}

// 1. Register root/first user - done
async function handleRegisterFirstUser(req, res) {
    try {
        const count = await User.countDocuments();
        if (count !== 0) { return res.status(404).json({message: 'First user already exists!'}) }

        if (count === 0) {
            const { 
                sponsorId,  
                registrationType, 
                gender, 
                name, 
                dob,
                mobileNumber,
                whatsappNumber, 
                email,
                state,
                district,
                pincode,
                address,
                gstNumber, // optional
                password
            } = req.body;
            

            // Check all parameters are recieved or not 
            if (!sponsorId || !registrationType || !gender || !name || !dob || !mobileNumber || !whatsappNumber || !email || !state || !district || !pincode || !address || !password) {
                return res.status(400).json({ message: 'Please provide all required fields' });
            }

            // First user registration (admin/root user)
            let generatedSponsorId = await generateUniqueSponsorID();
            const leftRefferalLink = `https://myudbhab.in/signupleft/${generatedSponsorId}`;
            const rightRefferalLink = `https://myudbhab.in/signupright/${generatedSponsorId}`;
    
            const newUser = await User.create({
                sponsorId: generatedSponsorId,
                registrationType, 
                gender, 
                name, 
                dob,
                mobileNumber,
                whatsappNumber, 
                email,
                state,
                district,
                pincode,
                address,
                gstNumber, // optional
                password,
                parentSponsorId: '',
                mySponsorId: generatedSponsorId,
                leftRefferalLink,
                rightRefferalLink
            });

            return res.status(201).json({ message: 'First user registered successfully', user: newUser });
        }
    }catch(e) {
        console.error(e);
        res.status(500).json({ message: 'Server error', error: e.message });
    }
}




// 2. Register user
// async function handleRegisterUser(req, res) {
//     try {
//         const count = await User.countDocuments();
//         if (count === 0) { return res.status(404).json({message: 'No tree exists. Firstly Register root user.'}) }

//         const { 
//             sponsorId,  
//             registrationType, 
//             gender, 
//             name, 
//             dob,
//             mobileNumber,
//             whatsappNumber, 
//             email,
//             state,
//             district,
//             pincode,
//             address,
//             gstNumber, // optional
//             password
//         } = req.body;

//         // Check all parameters are recieved or not 
//         if (!sponsorId || !registrationType || !gender || !name || !dob || !mobileNumber || !email || !state || !district || !pincode || !address || !password) {
//             return res.status(400).json({ message: 'Please provide all required fields' });
//         }

//         // Check if the Sponsor ID exists in the database
//         const sponsor = await User.findOne({ mySponsorId: sponsorId });
//         if (!sponsor) { return res.status(400).json({ message: 'Invalid Sponsor ID' }); }
    
//         // Check if email is already registered
//         let userFound = await User.findOne({ email: email });
//         if (userFound) { return res.status(404).json({ message: 'Email is already registered' }); }

//         // Check if Phone is already registered
//         let phoneFound = await User.findOne({ mobileNumber: mobileNumber });
//         if (phoneFound) { return res.status(404).json({ message: 'Phone number is already registered' }); }

//         // Check if Whatsapp number is already registered
        
//         if(whatsappNumber !== undefined ) {
//             if(whatsappNumber !== ""){
//         let whatsappNumberFound = await User.findOne({ whatsappNumber: whatsappNumber });
//         if (whatsappNumberFound) { return res.status(404).json({ message: 'Whatsapp number is already registered' }); }
//             }
//         }

//         // Check if GST number is already registered
//         if(gstNumber !== undefined ) {
//             if(gstNumber !== ""){
//                 let gstNumberFound = await User.findOne({ gstNumber: gstNumber });
//                 if (gstNumberFound) { return res.status(404).json({ message: 'GST number is already registered' }); }
//             }
//         }
        
        
        

//         // Generate a unique mySponsorId
//         let generatedSponsorId = await generateUniqueSponsorID();
//         const leftRefferalLink = `https://myudbhab.in/signupleft/${generatedSponsorId}`;
//         const rightRefferalLink = `https://myudbhab.in/signupright/${generatedSponsorId}`;

//         // Create new user
//         const newUser = await User.create({
//             sponsorId,
//             registrationType, 
//             gender, 
//             name, 
//             dob,
//             mobileNumber,
//             whatsappNumber, 
//             email,
//             state,
//             district,
//             pincode,
//             address,
//             gstNumber, // optional
//             password,
//             parentSponsorId: '',
//             mySponsorId: generatedSponsorId,
//             leftRefferalLink,
//             rightRefferalLink
//         });

//         // Attach to sponsor's binary tree
//         await findPositionAndAttach(sponsor, newUser);
//         return res.status(201).json({ message: 'User registered successfully', user: newUser });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Server error', error: error.message });
//     }
// }

async function handleRegisterUser(req, res) {
    try {
        const count = await User.countDocuments();
        if (count === 0) { return res.status(404).json({message: 'No tree exists. Firstly Register root user.'}) }

        const { 
            sponsorId,  
            registrationType, 
            gender, 
            name, 
            dob,
            mobileNumber,
            whatsappNumber, 
            email,
            state,
            district,
            pincode,
            address,
            gstNumber, // optional
            password
        } = req.body;

        // Check all parameters are recieved or not 
        if (!sponsorId || !registrationType || !gender || !name || !dob || !mobileNumber || !email || !state || !district || !pincode || !address || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Check if the Sponsor ID exists in the database
        const sponsor = await User.findOne({ mySponsorId: sponsorId });
        if (!sponsor) { return res.status(400).json({ message: 'Invalid Sponsor ID' }); }
    
        // Check if email is already registered
        let userFound = await User.findOne({ email: email });
        if (userFound) { return res.status(404).json({ message: 'Email is already registered' }); }

        // Check if Phone is already registered
        let phoneFound = await User.findOne({ mobileNumber: mobileNumber });
        if (phoneFound) { return res.status(404).json({ message: 'Phone number is already registered' }); }

        // Check if Whatsapp number is already registered
        
        if(whatsappNumber !== undefined ) {
            if(whatsappNumber !== ""){
        let whatsappNumberFound = await User.findOne({ whatsappNumber: whatsappNumber });
        if (whatsappNumberFound) { return res.status(404).json({ message: 'Whatsapp number is already registered' }); }
            }
        }

        // Check if GST number is already registered
        if(gstNumber !== undefined ) {
            if(gstNumber !== ""){
                let gstNumberFound = await User.findOne({ gstNumber: gstNumber });
                if (gstNumberFound) { return res.status(404).json({ message: 'GST number is already registered' }); }
            }
        }
        
        
        

        // Generate a unique mySponsorId
        let generatedSponsorId = await generateUniqueSponsorID();
        const leftRefferalLink = `https://myudbhab.in/signupleft/${generatedSponsorId}`;
        const rightRefferalLink = `https://myudbhab.in/signupright/${generatedSponsorId}`;

        // Create new user
        const newUser = await User.create({
            sponsorId,
            registrationType, 
            gender, 
            name, 
            dob,
            mobileNumber,
            whatsappNumber, 
            email,
            state,
            district,
            pincode,
            address,
            gstNumber, // optional
            password,
            parentSponsorId: '',
            mySponsorId: generatedSponsorId,
            leftRefferalLink,
            rightRefferalLink
        });

        // Attach to sponsor's binary tree
        await findPositionAndAttach(sponsor, newUser);
        const emailResponse = await sendMail(newUser);

        if (emailResponse === 'error') {
            console.error('Failed to send registration email.');
        }
        return res.status(201).json({ message: 'User registered successfully', user: newUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}


// 3. Register user using Left link
async function handleRegisterUsingLeftLink(req, res) {
    try {
        // New user details
        const { 
            sponsorId,  
            registrationType, 
            gender, 
            name, 
            dob,
            mobileNumber,
            whatsappNumber, 
            email,
            state,
            district,
            pincode,
            address,
            gstNumber, // optional
            password
        } = req.body;

        // Check all parameters are recieved or not 
        if (!sponsorId || !registrationType || !gender || !name || !dob || !mobileNumber || !email || !state || !district || !pincode || !address || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Check if the Sponsor ID exists in the database
        const sponsor = await User.findOne({ mySponsorId: sponsorId });
        if (!sponsor) { return res.status(400).json({ message: 'Invalid Sponsor ID' }); }
    
        // Check if email is already registered
        let userFound = await User.findOne({ email: email });
        if (userFound) { return res.status(404).json({ message: 'Email is already registered' }); }

        // Check if Phone is already registered
        let phoneFound = await User.findOne({ mobileNumber: mobileNumber });
        if (phoneFound) { return res.status(404).json({ message: 'Phone number is already registered' }); }
        // Check if Whatsapp number is already registered
        if(whatsappNumber !== undefined ) {
            if(whatsappNumber !== ""){
        let whatsappNumberFound = await User.findOne({ whatsappNumber: whatsappNumber });
        if (whatsappNumberFound) { return res.status(404).json({ message: 'Whatsapp number is already registered' }); }
            }
        }
        
       
        // Check if GST number is already registered
        if(gstNumber !== undefined ) {
            if(gstNumber !== ""){
                let gstNumberFound = await User.findOne({ gstNumber: gstNumber });
                if (gstNumberFound) { return res.status(404).json({ message: 'GST number is already registered' }); }
            }
        }
        
        
        

        // Generate a unique mySponsorId
        let generatedSponsorId = await generateUniqueSponsorID();
        const leftRefferalLink = `https://myudbhab.in/signupleft/${generatedSponsorId}`;
        const rightRefferalLink = `https://myudbhab.in/signupright/${generatedSponsorId}`;

        // Create new user
        const newUser = await User.create({
            sponsorId,
            registrationType, 
            gender, 
            name, 
            dob,
            mobileNumber,
            whatsappNumber, 
            email,
            state,
            district,
            pincode,
            address,
            gstNumber, // optional
            password,
            parentSponsorId: '',
            mySponsorId: generatedSponsorId,
            leftRefferalLink,
            rightRefferalLink
        });

        // Attach to sponsor's binary tree
        await placeInLeftSideOfTree(sponsor, newUser);
        const emailResponse = await sendMail(newUser);

        if (emailResponse === 'error') {
            console.error('Failed to send registration email.');
        }
        return res.status(201).json({ message: 'User registered successfully', user: newUser });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}




// 4. Register user using Right link
async function handleRegisterUsingRightLink(req, res) {
    try {
        // New user details
        const { 
            sponsorId,  
            registrationType, 
            gender, 
            name, 
            dob,
            mobileNumber,
            whatsappNumber, 
            email,
            state,
            district,
            pincode,
            address,
            gstNumber, // optional
            password
        } = req.body;

        // Check all parameters are recieved or not 
        if (!sponsorId || !registrationType || !gender || !name || !dob || !mobileNumber || !email || !state || !district || !pincode || !address || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Check if the Sponsor ID exists in the database
        const sponsor = await User.findOne({ mySponsorId: sponsorId });
        if (!sponsor) { return res.status(400).json({ message: 'Invalid Sponsor ID' }); }
    
        // Check if email is already registered
        let userFound = await User.findOne({ email: email });
        if (userFound) { return res.status(404).json({ message: 'Email is already registered' }); }

        // Check if Phone is already registered
        let phoneFound = await User.findOne({ mobileNumber: mobileNumber });
        if (phoneFound) { return res.status(404).json({ message: 'Phone number is already registered' }); }

        // Check if Whatsapp number is already registered
        if(whatsappNumber !== undefined ) {
            if(whatsappNumber !== ""){
        let whatsappNumberFound = await User.findOne({ whatsappNumber: whatsappNumber });
        if (whatsappNumberFound) { return res.status(404).json({ message: 'Whatsapp number is already registered' }); }
            }
        }
        // Check if GST number is already registered
        if(gstNumber !== undefined ) {
            if(gstNumber !== ""){
                let gstNumberFound = await User.findOne({ gstNumber: gstNumber });
                if (gstNumberFound) { return res.status(404).json({ message: 'GST number is already registered' }); }
            }
        }
        
        
        
        // Generate a unique mySponsorId
        let generatedSponsorId = await generateUniqueSponsorID();
        const leftRefferalLink = `https://myudbhab.in/signupleft/${generatedSponsorId}`;
        const rightRefferalLink = `https://myudbhab.in/signupright/${generatedSponsorId}`;

        // Create new user
        const newUser = await User.create({
            sponsorId,
            registrationType, 
            gender, 
            name, 
            dob,
            mobileNumber,
            whatsappNumber, 
            email,
            state,
            district,
            pincode,
            address,
            gstNumber, // optional
            password,
            parentSponsorId: '',
            mySponsorId: generatedSponsorId,
            leftRefferalLink,
            rightRefferalLink
        });

        // Attach to sponsor's binary tree
        await placeInRightSideOfTree(sponsor, newUser);
        const emailResponse = await sendMail(newUser);

        if (emailResponse === 'error') {
            console.error('Failed to send registration email.');
        }
        
        return res.status(201).json({ message: 'User registered successfully', user: newUser });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}




// 5. Login user
async function handleLoginUser(req, res) {
    try {
        const { sponsorId, password } = req.body;
        if (!sponsorId || !password) { return res.status(400).json({ message: 'Please enter both sponsorId and password' }); }

        // Check user exists OR not
        let user = await User.findOne({ mySponsorId: sponsorId });
        if (!user) { return res.status(404).json({ message: 'User not found' }); }
        

        const isPasswordMatch = await user.comparePassword(password);
        if (isPasswordMatch) {
            const payload = { email: user.email, id: user._id, role: 'user' };
            const token = generateToken(payload);
            return res.status(200).json({ token, userId: user._id, name: user.name, mySponsorId: user.mySponsorId});
        } else {
            return res.status(404).json({ message: 'Incorrect sponsorId OR password.' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}




// 6. Verify Sponsor
async function handleVerifySponsor(req, res) {
    try {
        const { sponsorId } = req.body;
        if (!sponsorId) { return res.status(400).json({ message: 'Please provide your Sponsor ID' }); }

        // Check if the Sponsor ID exists in the database
        const sponsor = await User.findOne({ mySponsorId: sponsorId });
        if (!sponsor) { return res.status(400).json({ message: 'Invalid Sponsor ID' }); }

        return res.status(200).json({ message: 'Sponsor verified successfully', sponsor: sponsor });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}




// 7. Find a specific user by its _id
async function handleFindUser(req, res) {
    try {
        const user = await User.findById(req.params.id);
        if (!user) { return res.status(404).json({ message: 'User not found' }); }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}




// 8. Get all sponsor's children with tree-like structure, upto level 4
async function handleGetSponsorChildrens(req, res) {
    try {
        // Find sponsor
        const sponsor = await User.findOne({ _id: req.params.id });
        if (!sponsor) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Build the tree
        const tree = await buildTree(sponsor);

        // Return the tree
        return res.status(200).json(tree);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}




// helper Recursive function to build the binary tree structure up to level 4
async function buildTree(user, level = 1) {
    if (!user || level > 4) return null; // Base case: If no user or level > 4, return null

    const userNode = {
        _id: user._id,
        value: user.name, 
        mySponsorId: user.mySponsorId,
        isActive: user.isActive,
        leftChild: null,
        rightChild: null
    };

    // Only fetch left and right children if the current level is less than 4
    if (level < 4) {
        if (user.binaryPosition && user.binaryPosition.left) {
            const leftChild = await User.findById(user.binaryPosition.left);
            userNode.leftChild = await buildTree(leftChild, level + 1);
        }

        if (user.binaryPosition && user.binaryPosition.right) {
            const rightChild = await User.findById(user.binaryPosition.right);
            userNode.rightChild = await buildTree(rightChild, level + 1);
        }
    }

    return userNode;
}





// 9. Handle extremeLeft 
async function handleExtremeLeft(req, res) {
    try {
        const { sponsorId } = req.body;
        console.log(sponsorId);
        
        if(!sponsorId) { return res.status(404).json({ message: "Please provide sponsor ID." }); }

        // Find the sponsor
        const user = await User.findOne({mySponsorId: sponsorId});
        if (!user) { return res.status(404).json({ message: 'Invalid SponsorId.' }); }

        // Find the extreme left user
        const extremeLeftUser = await findExtremeLeft(user);
        
        // Build the tree
        const tree = await buildTree(extremeLeftUser);
        return res.status(200).json(tree);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}




// helper function to find extreme left user
async function findExtremeLeft(user) {
    
    // Base case: If no left child or no binary position, return the current user
    if (!user.binaryPosition || !user.binaryPosition.left) return user; 

    // Recursively call the function for the left child
    const leftChild = await User.findById(user.binaryPosition.left);
    return await findExtremeLeft(leftChild);
}





// 10. Handle extremeRight
async function handleExtremeRight(req, res) {
    try {
        const { sponsorId } = req.body;
        if(!sponsorId) { return res.status(404).json({ message: "Please provide sponsor ID." }); }

        // Find the sponsor
        const user = await User.findOne({mySponsorId: sponsorId});
        if (!user) { return res.status(404).json({ message: 'User not found' }); }

        // Find the extreme right user
        const extremeRightUser = await findExtremeRight(user);
        
        // Build the tree
        const tree = await buildTree(extremeRightUser);
        return res.status(200).json(tree);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}




// helper function to find extreme right user
async function findExtremeRight(user) {
    
    // Base case: If no left child or no binary position, return the current user
    if (!user.binaryPosition || !user.binaryPosition.right) return user; 

    // Recursively call the function for the left child
    const rightChild = await User.findById(user.binaryPosition.right);
    return await findExtremeRight(rightChild);
}






// 11. Find all refferal
async function handleGetAllReferrals(req, res) {
    try {
        const { sponsorId } = req.body;
        if(!sponsorId) { return res.status(404).json({ message: "Please provide sponsor ID." }); }

        // Find the sponsor
        const user = await User.findOne({mySponsorId: sponsorId});
        if (!user) { return res.status(404).json({ message: 'User not found' }); }

        // Find all referrals
        const referrals = await User.find({ sponsorId: user.mySponsorId });
        return res.status(200).json(referrals);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}





// 12. Search for a specific sponsorId:  Get all sponsor's children with tree-like structure, upto level 4
async function handleSearchSpecificUser(req, res) {
    try {
        // Find sponsor
        const sponsor = await User.findOne({ mySponsorId: req.params.sponsorId });
        if (!sponsor) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Build the tree
        const tree = await buildTree(sponsor);

        // Return the tree
        return res.status(200).json(tree);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

async function handleAllUser(req, res) {
    try {
    const users = await User.find({})
        if (!users) { return res.status(404).json({ message: 'User not found' }); }
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}




async function handleUserbyitsid(req, res) {
    try {
        // Find sponsor
        const sponsor = await User.findOne({ mySponsorId: req.params.id });
        if (!sponsor) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        return res.status(200).json(sponsor);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}
// // 9. Edit user details API
async function handleEditUserDetails(req, res) {
    try {
        const {
            
            registrationType,
            gender,
            name,
            dob,
            mobileNumber,
            whatsappNumber,
            email,
            state,
            district,
            pincode,
            address,
            gstNumber,
            password,
        } = req.body;
        const sponsorId = req.headers.sponsorid; 

        // Find user by sponsorId
        const user = await User.findOne({ mySponsorId: sponsorId });
        if (!user) {
            return res.status(404).json({ message: 'User account not found' });
        }

        // Validate updates
        const updates = {
            registrationType,
            gender,
            name,
            dob,
            mobileNumber,
            whatsappNumber,
            email,
            state,
            district,
            pincode,
            address,
            gstNumber,
            password
        };

        // Validate unique fields
        const uniqueFields = ['mobileNumber', 'email', 'whatsappNumber', 'gstNumber'];
        for (const field of uniqueFields) {
            if (updates[field]) {
                const existing = await User.findOne({ [field]: updates[field] });
                if (existing && existing._id.toString() !== user._id.toString()) {
                    return res.status(409).json({ message: `${field} already exists` });
                }
            }
        }

        // Update user fields
        for (const [key, value] of Object.entries(updates)) {
            if (value !== undefined) {
                user[key] = value;
            }
        }

        // Update password if provided
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
        }

        // Validate Sponsor ID if needed
        // if (sponsorId) {
        //     return res.status(400).json({ message: 'Invalid Sponsor ID' });
        // }

        // Save the updated user
        await user.save();

        return res.status(200).json({ message: 'User details updated successfully', user });
    } catch (error) {
        console.error('Error updating user:', error.message);
        return res.status(500).json({ message: 'Error updating user', error: error.message });
    }
}

//10 search user for admin
const searchuser = async (req, res) => {
    try {
        const query = req.query.q;
        const users = await User.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { mySponsorId: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } },
                { mobileNumber: { $regex: query, $options: 'i' } }
              ]
        });
        return res.status(200).json({ message: 'user fetched successfully', users });
       
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
  };

module.exports = {
    handleRegisterFirstUser,
    handleRegisterUser,
    handleRegisterUsingLeftLink,
    handleRegisterUsingRightLink,
    handleLoginUser,
    handleVerifySponsor,
    handleFindUser,
    handleGetSponsorChildrens,
    handleExtremeLeft,
    handleExtremeRight,
    handleGetAllReferrals,
    handleSearchSpecificUser,
    handleAllUser,
    handleEditUserDetails,
    handleUserbyitsid,
    searchuser
}
