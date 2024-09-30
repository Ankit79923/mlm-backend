const User = require('../models/users');
const { v4: uuidv4 } = require('uuid');
const { findPositionAndAttach, placeInLeftSideOfTree, placeInRightSideOfTree } = require('../utils/placeInBinaryTree');
const { generateToken, verifyTokenMiddleware } = require('../middlewares/jwt');
const generateUniqueSponsorID = require('../utils/generateUniqueSponsorId');




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
            const leftRefferalLink = `${process.env.DOMAIN_URL}/signupleft/${generatedSponsorId}`;
            const rightRefferalLink = `${process.env.DOMAIN_URL}/signupright/${generatedSponsorId}`;
    
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
        if (!sponsorId || !registrationType || !gender || !name || !dob || !mobileNumber || !whatsappNumber || !email || !state || !district || !pincode || !address || !password) {
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
        let whatsappNumberFound = await User.findOne({ whatsappNumber: whatsappNumber });
        if (whatsappNumberFound) { return res.status(404).json({ message: 'Whatsapp number is already registered' }); }

        // Check if GST number is already registered
        if(gstNumber !== undefined) {
            let gstNumberFound = await User.findOne({ gstNumber: gstNumber });
            if (gstNumberFound) { return res.status(404).json({ message: 'GST number is already registered' }); }
        }
        
        
        

        // Generate a unique mySponsorId
        // let generatedSponsorId = uuidv4().slice(0, 10);
        let generatedSponsorId = await generateUniqueSponsorID();
        const leftRefferalLink = `${process.env.DOMAIN_URL}/signupleft/${generatedSponsorId}`;
        const rightRefferalLink = `${process.env.DOMAIN_URL}/signupright/${generatedSponsorId}`;

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
            mySponsorId: generatedSponsorId,
            leftRefferalLink,
            rightRefferalLink
        });

        // Attach to sponsor's binary tree
        await findPositionAndAttach(sponsor, newUser);
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
        if (!sponsorId || !registrationType || !gender || !name || !dob || !mobileNumber || !whatsappNumber || !email || !state || !district || !pincode || !address || !password) {
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
        let whatsappNumberFound = await User.findOne({ whatsappNumber: whatsappNumber });
        if (whatsappNumberFound) { return res.status(404).json({ message: 'Whatsapp number is already registered' }); }

        // Check if GST number is already registered
        if(gstNumber !== undefined) {
            let gstNumberFound = await User.findOne({ gstNumber: gstNumber });
            if (gstNumberFound) { return res.status(404).json({ message: 'GST number is already registered' }); }
        }
        
        
        

        // Generate a unique mySponsorId
        let generatedSponsorId = await generateUniqueSponsorID();
        const leftRefferalLink = `${process.env.DOMAIN_URL}/signupleft/${generatedSponsorId}`;
        const rightRefferalLink = `${process.env.DOMAIN_URL}/signupright/${generatedSponsorId}`;

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
            mySponsorId: generatedSponsorId,
            leftRefferalLink,
            rightRefferalLink
        });

        // Attach to sponsor's binary tree
        await placeInLeftSideOfTree(sponsor, newUser);
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
        if (!sponsorId || !registrationType || !gender || !name || !dob || !mobileNumber || !whatsappNumber || !email || !state || !district || !pincode || !address || !password) {
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
        let whatsappNumberFound = await User.findOne({ whatsappNumber: whatsappNumber });
        if (whatsappNumberFound) { return res.status(404).json({ message: 'Whatsapp number is already registered' }); }

        // Check if GST number is already registered
        if(gstNumber !== undefined) {
            let gstNumberFound = await User.findOne({ gstNumber: gstNumber });
            if (gstNumberFound) { return res.status(404).json({ message: 'GST number is already registered' }); }
        }
        
        
        

        // Generate a unique mySponsorId
        let generatedSponsorId = await generateUniqueSponsorID();
        const leftRefferalLink = `${process.env.DOMAIN_URL}/signupleft/${generatedSponsorId}`;
        const rightRefferalLink = `${process.env.DOMAIN_URL}/signupright/${generatedSponsorId}`;

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
            mySponsorId: generatedSponsorId,
            leftRefferalLink,
            rightRefferalLink
        });

        // Attach to sponsor's binary tree
        await placeInRightSideOfTree(sponsor, newUser);
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
            res.json({ token, userId: user._id });
        } else {
            res.status(404).json({ message: 'Incorrect sponsorId OR password.' });
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




module.exports = {
    handleRegisterFirstUser,
    handleRegisterUser,
    handleRegisterUsingLeftLink,
    handleRegisterUsingRightLink,
    handleLoginUser,
    handleVerifySponsor,
    handleFindUser,
    handleGetSponsorChildrens,
}
