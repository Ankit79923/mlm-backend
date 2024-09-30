const User = require('../models/users');
const { v4: uuidv4 } = require('uuid');
const { findPositionAndAttach, placeInLeftSideOfTree, placeInRightSideOfTree } = require('../utils/placeInBinaryTree');
const { generateToken, verifyTokenMiddleware } = require('../middlewares/jwt');


// Duplicate - Register user
// async function handleRegisterUser(req, res) {
//     const { name, email, password, sponsorId } = req.body;
    
//     // check if email already registered
//     let userFound = await User.findOne({ email: email });
//     if (userFound) { return res.status(404).json({ message: 'Email already registered' }); };

//     const count = await User.countDocuments();
//     if (count === 0) {
//         let generatedSponsorId = uuidv4().slice(0, 10);
//         const leftRefferalLink = `${process.env.DOMAIN_URL}/registerLeft?sponsorId=${generatedSponsorId}`;
//         const rightRefferalLink = `${process.env.DOMAIN_URL}/registerRight?sponsorId=${generatedSponsorId}`;
//         const newUser = new User({
//             name,
//             email,
//             password,
//             sponsorId: generatedSponsorId,
//             mySponsorId: generatedSponsorId,
//             leftRefferalLink,
//             rightRefferalLink
//         });
//         await newUser.save();
//         return res.status(201).json({ message: 'First user registered successfully', user: newUser });
//     }

//     try {
//         // Check if the Sponsor ID exists in the database
//         const sponsor = await User.findOne({ sponsorId: sponsorId });
//         if (!sponsor) {
//             return res.status(400).json({ message: 'Invalid Sponsor ID' });
//         }
        
//         // Creating sponsorID + leftLink + rightLink + user
//         let mySponsorId = uuidv4().slice(0, 10);
//         const leftRefferalLink = `${process.env.DOMAIN_URL}/registerLeft?sponsorId=${mySponsorId}`;
//         const rightRefferalLink = `${process.env.DOMAIN_URL}/registerRight?sponsorId=${mySponsorId}`;
//         const newUser = new User({
//             name,
//             email,
//             password,
//             sponsorId,
//             mySponsorId,
//             leftRefferalLink,
//             rightRefferalLink
//         });
//         await newUser.save();

//         console.log('Successfully registered new user');
        
//         // Attach to sponsor's binary tree
//         await findPositionAndAttach(sponsor, newUser);
//         res.status(201).json({ message: 'User registered successfully', user: newUser });
//     } catch (error) {
//         console.log(error.message);
//         res.status(500).json({ message: 'Server error', error });
//     }
// }



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
            let generatedSponsorId = uuidv4().slice(0, 10);
            const leftRefferalLink = `${process.env.DOMAIN_URL}/userdashboard/signupleft/${generatedSponsorId}`;
            const rightRefferalLink = `${process.env.DOMAIN_URL}/userdashboard/signupright/${generatedSponsorId}`;
    
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
        let generatedSponsorId = uuidv4().slice(0, 10);
        const leftRefferalLink = `${process.env.DOMAIN_URL}/userdashboard/signupleft/${generatedSponsorId}`;
        const rightRefferalLink = `${process.env.DOMAIN_URL}/userdashboard/signupright/${generatedSponsorId}`;

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
        let generatedSponsorId = uuidv4().slice(0, 10);
        const leftRefferalLink = `${process.env.DOMAIN_URL}/userdashboard/signupleft/${generatedSponsorId}`;
        const rightRefferalLink = `${process.env.DOMAIN_URL}/userdashboard/signupright/${generatedSponsorId}`;

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
        let generatedSponsorId = uuidv4().slice(0, 10);
        const leftRefferalLink = `${process.env.DOMAIN_URL}/userdashboard/signupleft/${generatedSponsorId}`;
        const rightRefferalLink = `${process.env.DOMAIN_URL}/userdashboard/signupright/${generatedSponsorId}`;

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
        const { email, password } = req.body;
        if (!email || !password) { return res.status(400).json({ message: 'Please provide email and password' }); }

        // Check user exists OR not
        let user = await User.findOne({ email: email });
        if (!user) { return res.status(404).json({ message: 'User not found' }); }
        

        const isPasswordMatch = await user.comparePassword(password);
        if (isPasswordMatch) {
            const payload = { email: user.email, id: user._id, role: 'user' };
            const token = generateToken(payload);
            res.json({ token, userId: user._id });
        } else {
            res.status(404).json({ message: 'Incorrect username OR password.' });
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





// async function handleShowAllChildren() {
//     try{
//         let user = await User.findOne({ _id: request.params.id});
//         if(!user) { return res.status(404).json({ message: 'Your account not found.' }); }

//         let children = [];
//         await findAllChildren(user, children);
//         res.status(200).json({ans: children});
//     }catch(error) {
//         res.status(500).json({ message: error.message });
//     }
// }



// async function findAllChildren(user, children) {
//     // single user case
//     if (!user.binaryPosition.left && !user.binaryPosition.right) { 
//         return [user]; 
//     }

//     if (user.binaryPosition.leftChild) {
//         const leftChild = await handleShowAllChildren(await User.findById(user.binaryPosition.leftChild));
//         children.push(...leftChild);
//     }

//     if (user.binaryPosition.rightChild) {
//         const rightChild = await handleShowAllChildren(await User.findById(user.rightChild));
//         children.push(rightChild);
//         return children;
//     }
// }


// Find user
async function handleFindUser(req, res) {
    try {
        const user = await User.findById(req.params.id);
        if (!user) { return res.status(404).json({ message: 'User not found' }); }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}



// ---------------------------------------------------------------- PREVIOUS VERSION
// Get all sponsor's children
// async function handleGetSponsorChildrens(req, res) {
//     try {
//         // Find the sponsor user by ID
//         const sponsor = await User.findOne({_id: req.params.id});
//         if (!sponsor) { return res.status(404).json({ message: 'User not found' }); }

//         // Array to hold all children
//         let children = [];

//         // Recursive function to get all children
//         // await findAllChildren2(sponsor, children);
//         await findAllChildren3(sponsor, children);

//         // Return the list of all children
//         return res.status(200).json({ message: 'Children fetched successfully', children });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ message: 'Server error', error: error.message });
//     }
// }
// ---------------------------------------------- recently Previously used functions
// Recursive function to find all children
// async function findAllChildren3(user, children, level = 1) {
//     // Base case: If the level exceeds 4 or if the user is null, return
//     if (level > 4) return;
    
//     // Add the current user or null if no user at this position
//     children.push(user ? { id: user._id, name: user.name } : null);
    
//     if (user) {
//         // Handle the left child
//         let leftChild = null;
//         if (user.binaryPosition && user.binaryPosition.left) {
//             leftChild = await User.findById(user.binaryPosition.left);
//         }
//         await findAllChildren3(leftChild, children, level + 1);

//         // Handle the right child
//         let rightChild = null;
//         if (user.binaryPosition && user.binaryPosition.right) {
//             rightChild = await User.findById(user.binaryPosition.right);
//         }
//         await findAllChildren3(rightChild, children, level + 1);
//     } else {
//         // If user is null, still add two nulls for missing left and right children
//         await findAllChildren3(null, children, level + 1);
//         await findAllChildren3(null, children, level + 1);
//     }
// }



// ---------------------------------------------------------------- NEW VERSION ----------------------------------------------------------------
// Get all sponsor's children with tree-like structure
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


// Currently working with this code - This finds all the children, we don't want this.
// Recursive function to build the binary tree structure
// async function buildTree(user) {
//     if (!user) return null;            // Base case: If no user, return null

//     const userNode = {
//         _id: user._id,
//         value: user.name, 
//         mySponsorId: user.mySponsorId,
//         leftChild: null,
//         rightChild: null
//     };

//     // Find left and right children recursively
//     if (user.binaryPosition && user.binaryPosition.left) {
//         const leftChild = await User.findById(user.binaryPosition.left);
//         userNode.leftChild = await buildTree(leftChild);
//     }

//     if (user.binaryPosition && user.binaryPosition.right) {
//         const rightChild = await User.findById(user.binaryPosition.right);
//         userNode.rightChild = await buildTree(rightChild);
//     }

//     return userNode;
// }


// Trying 
// Recursive function to build the binary tree structure up to level 4
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
