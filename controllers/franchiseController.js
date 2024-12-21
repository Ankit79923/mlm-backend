const Franchise = require('../models/franchise-models/franchise');
const Product = require('../models/admin-models/products');
const Inventory = require('../models/franchise-models/inventory');
const BVPoints = require('../models/user-models/bvPoints');
const User = require('../models/user-models/users');
const { generateToken } = require('../middlewares/jwt');
const client = require('../config/redis');
const FranchiseOrder = require('../models/franchise-models/franchiseOrders');
const UserOrder = require('../models/user-models/userOrders');
const generateUniquePupId = require('../utils/generateUniquePupId');
// const userOrders = require('../models/user-models/userOrders');
// const { default: orders } = require('razorpay/dist/types/orders');
// const Razorpay = require('razorpay');



// 1. Create new Franchise - only by admin
const handleCreateFranchise = async (req, res) => {
    try {
        const { franchiseName, email, password, contactInfo, address, state, district, pincode } = req.body;

        // Check if the franchise email already exists
        const existingFranchise = await Franchise.findOne({ email });
        if (existingFranchise) {
            return res.status(400).json({ message: 'Franchise already exists with this email.' });
        }

        // Generate unique franchise ID

        let generateFranchiseID = await generateUniquePupId();
        // Check if any franchise ID exists in the database

        // const franchise = await Franchise.findOne({franchiseId: generateFranchiseID});
        // if(!franchise){
        //     res.status(404).json({message: 'Invalid franchise ID'});
        // }

        // Check if the franchise contactInfo already exists
        const contactNumber = await Franchise.findOne({ contactInfo });
        if (contactNumber) {
            return res.status(400).json({ message: 'Franchise already exists with this contact Number.' });
        }

        // Create a new franchise
        const newFranchise = await Franchise.create({
            franchiseId: generateFranchiseID,
            franchiseName,
            email,
            password: password, // Store hashed password
            contactInfo,
            address,
            state,
            district,
            pincode
        });

        return res.status(201).json({ message: 'Franchise created successfully', franchiseId: newFranchise.franchiseId });
    } catch (error) {
        console.error('Error creating franchise:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}



// 2. Get all Franchises - only by admin
const handleGetAllFranchises = async (req, res) => {
    try {
        const franchises = await Franchise.find({});
        return res.status(200).json(franchises);
    } catch (error) {
        console.error('Error fetching franchises:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}




// 3. Assign Products to Franchise - only by admin
const handleAssignProductsToFranchise = async (req, res) => {
    try {
        const { franchiseId } = req.params;
        const { products } = req.body;

        // Find the franchise by franchiseId
        const franchise = await Franchise.findOne({ franchiseId });
        if (!franchise) { return res.status(404).json({ message: 'Incorrect FranchiseID' }); }


        // Find or create the inventory for the franchise
        let inventory = await Inventory.findOne({ franchiseId: franchise._id });
        if (!inventory) {
            // If no inventory exists for the franchise, create a new one
            inventory = await Inventory.create({ franchiseId: franchise._id, products: [] });
        }

        // Loop through products & check if all products are available in stock OR not.
        for (const product of products) {
            const { productId, quantity, price, bvPoints } = product; 
            if (!productId || !quantity || !price || !bvPoints) {
                return res.status(400).json({ message: 'Please enter all the Required fields.' });
            }

            // Check if the product exists in Products collection
            const productFound = await Product.findById(productId);
            if (!productFound) { return res.status(404).json({ message: `Product with ID ${productId} not found.` }); }

            // Check if the product quantity is available
            if (productFound.stock < quantity) {
                return res.status(200).json({ message: `Product: ${productFound.name} has only ${productFound.stock} quantity in Stock.` });
            }
        }

        // Loop through products and update inventory
        const assignedProducts = [];
        let totalPrice = 0;
        for (const product of products) {
            const { productId, quantity, price, bvPoints } = product; 
            if (!productId || !quantity || !price || !bvPoints) {
                return res.status(400).json({ message: 'Please enter all the Required fields.' });
            }

            // Check if the product exists in Products collection
            const productFound = await Product.findById(productId);
            if (!productFound) { return res.status(404).json({ message: `Product with ID ${productId} not found.` }); }

            // Check if the product quantity is available
            if (productFound.stock < quantity) {
                return res.status(200).json({ message: `Product with productId: ${productId} has only ${productFound.stock} quantity in Stock.` });
            }


            // Add/Update product in the franchise's inventory
            const existingInventoryItem = inventory.products.find(item => item.productId.toString() === productId);
            if (existingInventoryItem) {
                // If the product already exists in the inventory, update the quantity and other details
                existingInventoryItem.quantity += quantity;     // Update quantity
                existingInventoryItem.price = price;            // Update price
                existingInventoryItem.bvPoints = bvPoints;      // Update bvPoints
                totalPrice += price * quantity;                   // Calculate Price
            } else {
                // If product does not exist, add it to the franchie's inventory
                inventory.products.push({ productId, quantity, price, bvPoints });
                totalPrice += price * quantity;
            }

            assignedProducts.push({ productId, quantity, price, bvPoints });
            productFound.stock -= quantity;
            await productFound.save();

            // Invalidate the cached products data
            await client.del(`product:productId:${productId}`);
            // await client.del('product:allProducts');
        }

        // Save the updated inventory
        await inventory.save();

        // Invalidate the cached products data
        await client.del('product:allProducts');

        // ----------------------------------------------------------------------------
        // Call saveOrderDetails after assigning products
        await saveOrderDetails(franchise._id, franchiseId, products);

        // Respond with success
        return res.status(200).json({ message: 'Products assigned successfully to franchise', franchiseId, assignedProducts, totalPrice });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};






// Function to save order details for franchise
const saveOrderDetails = async (franchiseObjectId, franchiseId, products) => {
    try {
        // Calculate total amount
        let totalAmount = 0;

        const productDetails = await Promise.all(
            products.map(async (product) => {
                const { productId, quantity, price, bvPoints } = product;
                totalAmount += price * quantity;

                const productFound = await Product.findOne({ _id: productId });
                if (!productFound) {
                    throw new Error(`Product with ID ${productId} not found`);
                }

                return {
                    productId,
                    name: productFound.name,
                    quantity,
                    price,
                    totalAmount: price * quantity,
                };
            })
        );

        // Generate a unique order number
        const orderNumber = await generateUniqueFranchiseOrderNumber();

        // Create and save the order document
        const order = new FranchiseOrder({
            franchiseDetails: {
                franchise: franchiseObjectId,
                franchiseId: franchiseId
            },
            orderDetails: {
                orderNumber,
                totalAmount
            },
            products: productDetails,
        });

        await order.save();
        console.log('Order saved successfully:', order);

        // return order;
    } catch (error) {
        console.error('Error saving order details:', error.message);
        throw new Error('Failed to save order details');
    }
};


// helper => generate Unique Franchise Order Number
const generateUniqueFranchiseOrderNumber = async () => {
    let orderNumber;
    let isUnique = false;

    while (!isUnique) {
        // Generate a random 7-digit number
        orderNumber = Math.floor(1000000 + Math.random() * 9000000);

        // Check if this order number already exists in the database
        const existingOrder = await FranchiseOrder.findOne({ "orderDetails.orderNumber": orderNumber });
        if (!existingOrder) {
            isUnique = true;
        }
    }

    return orderNumber;
};



// 4. Handle Get Franchies Inventory
const handleGetFranchiesInventory = async (req, res) => {
    try {
        const { franchiseId } = req.params;
        if (!franchiseId) {
            return res.status(400).json({ message: 'Please provide Franchise ID' });
        }

        // Find the franchise by franchiseId
        const franchise = await Franchise.findOne({ franchiseId });
        if (!franchise) {
            return res.status(404).json({ message: 'Incorrect FranchiseID' });
        }

        // Find the inventory for the franchise
        let inventory = await Inventory.findOne({ franchiseId: franchise._id });
        if (!inventory) {
            return res.status(200).json({ message: 'Inventory not found' });
        }

        // Map through the inventory products and fetch additional details from Products model
        const inventoryWithProductDetails = await Promise.all(
            inventory.products.map(async (item) => {
                const product = await Product.findById(item.productId);
                if (product) {
                    return {
                        productId: item.productId,
                        productName: product.name,            // Add product name from the Product model
                        productImage: product.imageURL,        // Add product imageURL from the Product model
                        stock: item.quantity,
                        price: item.price,
                        bvPoints: item.bvPoints,
                        isAvailable: item.isAvailable,
                    };
                }
                return item; // If product not found, return the original item
            })
        );

        // Return the inventory with product details
        return res.status(200).json(inventoryWithProductDetails);
    } catch (e) {
        console.log(e.message);
        return res.status(500).json({ message: 'Error finding Inventory', error: e.message });
    }
};
// const handleGetFranchiesInventory = async (req, res) => {
//     try {
//         const { franchiseId } = req.params;
//         if (!franchiseId) {
//             return res.status(400).json({ message: 'Please provide Franchise ID' });
//         }

//         // Find the franchise by franchiseId
//         const franchise = await Franchise.findOne({ franchiseId });
//         if (!franchise) {
//             return res.status(404).json({ message: 'Incorrect FranchiseID' });
//         }

//         // Find the inventory for the franchise and populate product details (name, image, etc.)
//         let inventory = await Inventory.findOne({ franchiseId: franchise._id }).populate({
//             path: 'products.productId', // Reference to the product field in the inventory schema
//             select: 'productName imageURL', // Select only the required fields (name and image)
//         });

//         if (!inventory) {
//             return res.status(404).json({ message: 'Inventory not found for the given franchise' });
//         }

//         // Return the populated inventory with product details
//         return res.status(200).json(inventory.products);
//     } catch (e) {
//         console.log(e.message);
//         return res.status(500).json({ message: 'Error finding Inventory', error: e.message });
//     }
// };



// 4. Get all Dashboard data on Franchise



const handleGetFranchiseDashboardData = async (req, res) => {
    try {
        const {franchiseId} = req.params;

        if(!franchiseId) {
            return res.status(404).json({message: "Please provide a Frachise ID."});
        }

        // Find the franchise by franchise ID

        const franchise = await Franchise.findOne({franchiseId});
        if(!franchise) {
            return res.status(404).json({message: "Incorrect Franchise ID"});
        }

        //Find the inventory for the franchise

        let inventory = await Inventory.findOne({franchiseId: franchise._id});
        if(!inventory) {
            return res.status(404).json({message: "Inventory not found"});
        }

        // Calculate Monthly Sales
        // const currentMonth = new Date().getMonth();
        // const currentYear = new Date().getFullYear();
        // const monthlyOrders = await UserOrder.find({
        //     'franchiseDetails.franchiseId': franchiseId,
        //     'orderDetails.createdAt': {
        //         $gte: new Date(currentYear, currentMonth, 1),
        //         $lt: new Date(currentYear, currentMonth + 1, 1)
        //     }
        // });

        // const totalMonthlySales = monthlyOrders.reduce((total, order) => total + order.orderDetails.totalAmount, 0);
        
    // Get current date
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startOfNextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

    // Find orders created in the current month
    const monthlyOrders = await UserOrder.find({
      'franchiseDetails.franchiseId': franchiseId,
      createdAt: {
        $gte: startOfMonth,
        $lt: startOfNextMonth,
      },
    });
//monthly order 



// Find orders created in the current month
const monthlyOrdersProduct = await UserOrder.find({
  'franchiseDetails.franchiseId': franchiseId,
  createdAt: {
    $gte: startOfMonth,
    $lt: startOfNextMonth,
  },
});


// Calculate total number of orders in the current month
const totalOrdersInMonth = monthlyOrders.length;
    // Calculate total monthly sales
    const totalMonthlySales = monthlyOrders.reduce((total, order) => {
      return total + (order.orderDetails?.totalAmount || 0);
    }, 0);

   
    console.log("Total monthly sales:", totalMonthlySales);


        // Calculate total sales

        const totalSales = await UserOrder.aggregate([
            {$match: {'franchiseDetails.franchiseId': franchiseId}},
            {$group: {_id: null, totalAmount: {$sum: "$orderDetails.totalAmount"}}}
        ]);

        const totalSalesAmount = totalSales.length > 0 ? totalSales[0].totalAmount : 0;


        const calculateAvailableStocks = async (inventory) => {
            let totalValue = 0;
        
            for (const item of inventory.products) {
                const product = await Product.findById(item.productId);
                if (product) {
                    totalValue += product.price * item.quantity;
                }
            }
        
            return totalValue; // Return after the loop completes
        };
        const availableStocksValue = await calculateAvailableStocks(inventory);
        

        // Return the dashboard data

        return res.status(200).json({
            totalMonthlySales,
            totalSalesAmount,
            totalOrdersInMonth,
            availableStocksValue
            
            
            // inventory: inventory.products
        });
    } catch (error) {
        console.error('Error fetching franchise dashboard data:', error);
        return res.status(500).json({message: 'Internal server error', error: error.message});        
    }
}


// 5. Remove Product from Franchise Inventory - only by admin




const handleRemoveProductFromFranchiseInventory = async (req, res) => {
    try {
        const { franchiseId, productId } = req.params;
        if (!franchiseId || !productId) { return res.status(400).json({ message: 'Please provide both Franchise ID and Product ID' }); }


        // Find the franchise by franchiseId
        const franchise = await Franchise.findOne({ franchiseId });
        if (!franchise) { return res.status(404).json({ message: 'Franchise not found with the provided Franchise ID' }); }


        // Find the inventory for the franchise
        let inventory = await Inventory.findOne({ franchiseId: franchise._id });
        if (!inventory) {
            return res.status(404).json({ message: 'Inventory not found for the given franchise' });
        }


        // Find and remove the product from the inventory
        const productIndex = inventory.products.findIndex(item => item.productId.toString() === productId);
        if (productIndex === -1) {
            return res.status(404).json({ message: 'Product not found in the franchise inventory' });
        }


        // Remove the product from the inventory array
        inventory.products.splice(productIndex, 1);


        // Save the updated inventory
        await inventory.save();

        // Respond with success
        return res.status(200).json({
            message: 'Product removed successfully from franchise inventory',
            franchiseId,
            productId
        });
    } catch (error) {
        console.error('Error removing product from franchise inventory:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};




// 6. Handle Login franchise
const handleLoginFranchise = async (req, res) => {
    try {
        const { franchiseId, password } = req.body;
        if (!franchiseId || !password) { return res.status(400).json({ message: 'Please provide both franchiseId and password.' }); }

        // Find the franchise by email
        const franchise = await Franchise.findOne({ franchiseId });
        if (!franchise) { return res.status(401).json({ message: 'Invalid franchiseId.' }); }

        // Check the password
        const isPasswordMatch = franchise.password === password ? true : false;
        if (isPasswordMatch) {
            const payload = { email: franchise.email, id: franchise._id, role: 'franchise' };
            const token = generateToken(payload);
            return res.json({ token, userId: franchise._id, email: franchise.email, contactno: franchise.contactInfo,  name: franchise.franchiseName, franchiseId: franchise.franchiseId });
        } else {
            return res.status(404).json({ message: 'Invalid franchiseId or password.' });
        }
    } catch (error) {
        console.error('Error logging in franchise:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}





// 7. Handle Calculate totall Bill
const handleCalculateTotalBill = async (req, res) => {
    try {
        const { userSponsorId, franchiseId, products } = req.body;
        if (!franchiseId || !products) { return res.status(400).json({ message: 'Please provide both Franchise ID and Products.' }); }

        // Find user from sponsorId
        const user = await User.findOne({ mySponsorId: userSponsorId });
        if (!user) { return res.status(404).json({ message: 'Incorrect sponsorID' }); }

        // Find the franchise by franchiseId
        const franchise = await Franchise.findOne({ franchiseId });
        if (!franchise) { return res.status(404).json({ message: 'Incorrect FranchiseID' }); }

        // Find the inventory for the franchise
        let inventory = await Inventory.findOne({ franchiseId: franchise._id });
        if (!inventory) { return res.status(404).json({ message: 'Inventory not found for the given franchise' }); }

        // products recieved from body is an array, which contains multiple products. Check if all the products recieved exists in body OR not.
        for (let product of products) {
            const { productId, quantity } = product;
            if (!productId || !quantity) { return res.status(400).json({ message: 'Please provide both Product ID and Quantity for each product.' }); }

            // const productFound = inventory.products.find(item => item.productId.toString() === productId);
            const productFound = inventory.products.find(function (item) {
                return item.productId.toString() === productId;
            });
            if (!productFound) { return res.status(404).json({ message: `Product with ID ${productId} not found in your inventory.` }); }

            if (productFound.quantity < quantity) {
                return res.status(200).json({ message: `Product with productId: ${productId} has only ${productFound.quantity} quantity in Stock.` });
            }
        }
        // console.log('All products found in inventory & Stock is also available.');


        // Calculate total bill
        let totalPrice = 0;
        let totalBvPoints = 0;
        for (let product of products) {
            const { productId, quantity } = product;
            const productFound = inventory.products.find(item => item.productId.toString() === productId);
            // Reduce the product's stock
            productFound.quantity -= quantity;
            await inventory.save();
            // Total bv points earned in this purchase
            totalBvPoints += quantity * productFound.bvPoints;
            totalPrice += productFound.price * quantity;
        }

        await addPersonalBVpoints(user, totalBvPoints);
        await addBvPointsToAncestors(user, totalBvPoints);
        await createUserOrder(user, franchiseId, totalPrice, totalBvPoints, products);
        if (user.isActive === false) {
            user.isActive = true;
            user.activeDate = new Date();
            await user.save();
        }
        
        return res.status(200).json({ message: 'Total bill calculated successfully', totalPrice });
    } catch (error) {
        console.error('Error calculating total bill:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}


async function addPersonalBVpoints(user, totalBvPoints) {
    try {
        // Find BV Points document for user
        let userBVPoints = await BVPoints.findOne({ userId: user._id });
        if (!userBVPoints) {
            // user BVPoints doesn't exists => user- isActive: false  => create userBVPoints
            userBVPoints = await BVPoints.create({ userId: user._id });
        }

        userBVPoints.personalBV += totalBvPoints;
        await userBVPoints.save();
    } catch (error) {
        console.error('Error adding personal BV points:', error);
    }
}


async function addBvPointsToAncestors(user, totalBvPoints) {
    try {
        let currentUser = user;
        let rcvdSponsorId = user.sponsorId;

        while (currentUser.parentSponsorId) {                                                                    // Traverse through the ancestors and update their BV points
            const ancestor = await User.findOne({ mySponsorId: currentUser.parentSponsorId });
            if (!ancestor) break;

            // Find BV Points document for ancestor
            let ancestorBVPoints = await BVPoints.findOne({ userId: ancestor._id });
            if (!ancestorBVPoints) {
                // If BVPoints document doesn't exist, create a new one
                // Create a new BVPoint Doc only if user is Active.
                // ancestorBVPoints = new BVPoints({ userId: ancestor._id });
                if (ancestor.isActive === true) {
                    ancestorBVPoints = new BVPoints({ userId: ancestor._id });
                } else if (ancestor.isActive === false) {
                    currentUser = ancestor;
                    continue;
                }
            }


            // Check if current user (purchaser) is in the left or right subtree of ancestor
            const isInLeftTree = await checkIfInLeftTree(ancestor, currentUser);
            if (isInLeftTree) {
                ancestorBVPoints.totalBV.leftBV += totalBvPoints;
                ancestorBVPoints.currentWeekBV.leftBV += totalBvPoints;
                ancestorBVPoints.currentMonthBV.leftBV += totalBvPoints;
                await ancestorBVPoints.save();
            }
            else {
                ancestorBVPoints.totalBV.rightBV += totalBvPoints;
                ancestorBVPoints.currentWeekBV.rightBV += totalBvPoints;
                ancestorBVPoints.currentMonthBV.rightBV += totalBvPoints;
                await ancestorBVPoints.save();
            }

            if (ancestor.mySponsorId === rcvdSponsorId) {
                // This ancestor is the sponsor of buyer.
                // add Direct BV Points to ancestors bvPoints Schema.
                // Check if current user (purchaser) is in the left or right subtree of ancestor
                if (isInLeftTree) { ancestorBVPoints.directBV.leftBV += totalBvPoints; }
                else { ancestorBVPoints.directBV.rightBV += totalBvPoints; }
                await ancestorBVPoints.save();
            }


            // Move to the next ancestor (parent of the current ancestor)
            currentUser = ancestor;
        }

        console.log('BV points successfully added to ancestors.');
    } catch (error) {
        console.error('Error while adding BV points to ancestors:', error);
    }
};



async function checkIfInLeftTree(ancestor, user) {
    if (ancestor.binaryPosition) {
        // Check if the user's ID matches the left child's ID
        if (ancestor.binaryPosition.left && ancestor.binaryPosition.left.toString() === user._id.toString()) {
            return true;
        }
        // Check if the user's ID matches the right child's ID
        else if (ancestor.binaryPosition.right && ancestor.binaryPosition.right.toString() === user._id.toString()) {
            return false;
        }
    }

    return false;
}


// Function to save order details for franchise
async function createUserOrder(user, franchiseId, totalPrice, totalBvPoints, products) {
    try {
        // Generate a unique order number
        const orderNumber = await generateUniqueUserOrderNumber();
        // const orderNumber = 55001;

        // Prepare product details directly from `products`
        const productDetails = [];
        for (let product of products) {
            // Retrieve the full product details using the productId
            const productData = await Product.findById(product.productId);
            if (!productData) {
                console.error(`Product with ID ${product.productId} not found`);
                continue; // Skip this product if not found
            }

            productDetails.push({
                productId: product.productId,
                name: productData.name, // Get the product name from the retrieved data
                quantity: product.quantity,
                price: productData.price, // Use the price from the product data
                totalAmount: productData.price * product.quantity
            });
        }

        // Create and save the order document
        const order = new UserOrder({
            userDetails: {
                user: user._id,
                userName: user.name
            },
            franchiseDetails: {
                franchiseId: franchiseId
            },
            orderDetails: {
                orderNumber: orderNumber,
                totalAmount: totalPrice,
                totalBVPoints: totalBvPoints
            },
            products: productDetails,
            deliveryMode: 'Pickup Point'
        });
        

        await order.save();
        console.log('User Order saved successfully:', order);
    } catch (error) {
        console.error('Error saving user order details:', error.message);
        throw new Error('Failed to save order details');
    }
};


// helper => generate Unique User Order Number
const generateUniqueUserOrderNumber = async () => {
      let orderNumber;
      let isUnique = false;

      while (!isUnique) {
        // Generate a random 7-digit number
        orderNumber = Math.floor(1000000 + Math.random() * 9000000);

        // Check if this order number already exists in the database
        const existingOrder = await UserOrder.findOne({ "orderDetails.orderNumber": orderNumber });
        if (!existingOrder) {
          isUnique = true;
        }
      }

      return orderNumber;
};





// 8. Handle find all users
const handleGetAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, 'name mySponsorId');
        return res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}




// 9. Get Franchise Orders
const handleGetFranchiseOrders = async (req, res) => {
    try {
        const franchiseId = req.body.franchiseId;
        if (!franchiseId) {
            return res.status(400).json({ message: 'Please provide Franchise ID' });
        }

        const franchiseOrders = await FranchiseOrder.find({ 'franchiseDetails.franchiseId': franchiseId });
        if (!franchiseOrders) {
            return res.status(200).json({ message: 'No Orders Found.' });
        }

        return res.status(200).json({ "orders": franchiseOrders });
    }
    catch (e) {
        console.error('Error fetching franchise:', e);
        return res.status(500).json({ message: 'Internal server error' });
    }
}



// 10. Get all Orders created by Franchise
const handleGetAllOrdersCreatedByFranchise = async (req, res) => {
    try{
        const { franchiseId } = req.body;      // It is not ObjectId, BUT franchiseCode -> so it is a String
        if (!franchiseId) {
            return res.status(400).json({ message: 'Please provide franchiseId.' });
        }

        const franchiseOrders = await UserOrder.find({ 'franchiseDetails.franchiseId': franchiseId }).populate('userDetails.user', 'mySponsorId name email');
        return res.status(200).json({ franchiseOrders });
    }catch (e) {
        console.error('Error fetching orders:', e);
        return res.status(500).json({ message: e.message });
    }
}


module.exports = {
    handleCreateFranchise,
    handleGetAllFranchises,
    handleAssignProductsToFranchise,
    handleGetFranchiesInventory,
    handleRemoveProductFromFranchiseInventory,
    handleLoginFranchise,
    handleCalculateTotalBill,
    handleGetAllUsers,
    handleGetFranchiseOrders,
    handleGetAllOrdersCreatedByFranchise,
    handleGetFranchiseDashboardData,
    addPersonalBVpoints,
    addBvPointsToAncestors
}


