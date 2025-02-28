const User = require('../models/user-models/users');
const Product = require('../models/admin-models/products');
const Wishlist = require('../models/user-models/wishlists');
const { generateToken, verifyTokenMiddleware } = require('../middlewares/jwt');
const { addPersonalBVpoints, addBvPointsToAncestors } = require('./franchiseController');
const client = require('../config/redis');
const UserOrder = require('../models/user-models/userOrders');
const { s3Client, PutObjectCommand } = require('../utils/s3Bucket');


// 1. Add Product - done
async function handleAddProduct(req, res) {
    try {
        console.log('Inside function');
        console.log(req.body);
        
        const { name, category, price, mrp_price, bvPoints, description, stock, ingredients, product_benefits, how_to_use, disclaimer } = req.body;
        if(!name || !category || !price || !mrp_price || !bvPoints || !description || !stock || !ingredients || !product_benefits || !how_to_use || !disclaimer) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Upload the product image to S3 bucket
        const file = req.file;
        if (!file) { return res.status(400).json({ message: 'Please upload an image.' }); }

        const params = {
            Bucket: 'mlm-assets-bucket', // Your S3 bucket name
            Key: `product-images/${Date.now()}_${file.originalname}`, // Unique file name
            Body: file.buffer,
            ContentType: file.mimetype, // Ensure the correct MIME type is set
        };
        const command = new PutObjectCommand(params);
        await s3Client.send(command);

        const publicUrl = `https://${params.Bucket}.s3.ap-south-1.amazonaws.com/${params.Key}`;   // Public URL for the uploaded file   
        

        // Create New Product 
        const newProduct = await Product.create({
            name,
            category,
            price,
            bvPoints,
            imageName: req.file.originalname,
            imageURL: publicUrl,
            description,
            stock,
            ingredients,
            product_benefits,
            how_to_use,
            disclaimer,mrp_price
        });
        
        // Invalidate the cached products data
        await client.del('product:allProducts');

        res.status(200).json({ message: 'Product added successfully', product: newProduct });
    } catch (error) {
        res.status(500).json({ error: 'Error adding product', message: error.message });
    }
}


// 2. Edit product - done
async function handleEditProduct(req, res) {
    try {
        const updatedProduct = await Product.findById(req.params.id);

        if (!updatedProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        // Update other product fields manually
        if(req.body) {
            Object.assign(updatedProduct, req.body);
            console.log(req.body);   
        }
        
        // Only update image fields if a file was uploaded
        const file = req.file
        if (file) {
            const params = {
                Bucket: 'mlm-assets-bucket', // Your S3 bucket name
                Key: `product-images/${Date.now()}_${file.originalname}`, // Unique file name
                Body: file.buffer,
                ContentType: file.mimetype, // Ensure the correct MIME type is set
            };
            const command = new PutObjectCommand(params);
            await s3Client.send(command);
            const publicUrl = `https://${params.Bucket}.s3.ap-south-1.amazonaws.com/${params.Key}`;   // Public URL for the uploaded file   
            
            updatedProduct.imageName = req.file.originalname;
            updatedProduct.imageURL = publicUrl;
        }
        
        // Save the updated product
        await updatedProduct.save();

        // Invalidate the cached products data
        await client.del('product:allProducts');
        await client.del(`product:productId:${req.params.id}`);
        

        // send the updated product
        res.status(200).json({ message: 'Product updated successfully', product: updatedProduct });
    } catch (error) {
        console.log(error);
        console.log(error.message); 
        res.status(500).json({ error: 'Error updating product' });
    }
}


// 3. Delete product - done
async function handleDeleteProduct(req, res) {
    try {        
        const deletedProduct = await Product.findByIdAndDelete({ _id: req.params.id });
        if (!deletedProduct) {
            console.log("Can't delete product"); 
            return res.status(404).json({ message: 'Product not found' });
        }

        // Invalidate the cached products data
        await client.del('product:allProducts');

        // Delete related wishlist items
        // await Wishlist.deleteMany({ productId: req.params.id });

        // Invalidate the cached products data
        await client.del('product:allProducts');
        await client.del(`product:productId:${req.params.id}`);

        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.log(error.message);
        
        res.status(500).json({ error: 'Error deleting product', message: error.message });
    }
}


// 4. Get all products - done
async function handleViewProducts(req, res) {
    try {
        const value = await client.get('product:allProducts');
        if (value) {
            console.log("Value exists in Redis memory", value);
            // console.log(JSON.parse(value));  
            return res.json( {'products': JSON.parse(value)} );
        }

        const products = await Product.find({});    
        if(!products) { return res.status(404).json({ message: 'Products not found' }) };

        try{
            await client.set('product:allProducts', JSON.stringify(products));
            console.log('All Products data stored in Redis memory');
        }catch(redisError) {
            console.log("Error saving user to Redis:", redisError);
        }

        res.status(200).json({ message: 'Products fetched successfully', products: products });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching products', message: error.message });
    }
}


// 5. Get product by ID - done
async function handleGetProductById(req, res) {
    try {
        const valueFromRedis = await client.get(`product:productId:${req.params.id}`);
        if (valueFromRedis) {
            console.log("Value exists in Redis memory", valueFromRedis); 
            return res.status(200).json( {'message': "Product fetched successfully", 'product': JSON.parse(valueFromRedis)} );
        }
        
        const product = await Product.findById(req.params.id); 
        if (!product) { return res.status(404).send({ message: 'Product not found' }) }; 

        // Store product in Redis memory
        try{
            await client.set(`product:productId:${req.params.id}`, JSON.stringify(product));
            console.log(`Product ID ${req.params.id} data stored in Redis memory`);
        }catch(redisError) {
            console.log("Error saving user to Redis:", redisError);
        } 

        // Send response with product data and image URL 
        res.status(200).json({ message: 'Product fetched successfully', product: product }); 
    } catch (error) { 
        console.error(error); 
        res.status(500).send({ message: 'Server error' }); 
    } 
}


async function handleClearAllRedisCache(req, res) {
    try {
      // Flush all keys in Redis
      await client.flushAll();
      
      res.status(200).json({ message: 'All Redis cache cleared successfully' });
    } catch (error) {
      console.log('Error clearing Redis cache:', error.message);
      res.status(500).json({ error: 'Failed to clear Redis cache', message: error.message });
    }
}



// -------------------------------------------------------------------------------------------------------------------------
// Add products to cart
async function handleAddProductsToCart(req, res) {
    try {
        const productsId = req.body.products;                                       // Array of product IDs
        const products = await Product.find({ _id: { $in: productsId } });          // Fetch all the products by their IDs from the 'Product' model
        if (products.length === 0) { return res.status(404).json({ message: 'No products found for the given IDs' }); }

        // Calculate the total price of the selected products
        const totalPrice = products.reduce((acc, product) => acc + product.price, 0);

        res.status(200).json({ message: 'Products added to cart successfully', totalPrice: totalPrice, products: products });
    } catch (error) {
        res.status(500).json({ error: 'Error adding products to cart', message: error.message });
    }
}



// Add product to wishlist
async function handleAddProductToWishlist(req, res) {
    try {
        // Get userId from request and productId from body
        const userId = req.userPayload.id;
        const productId = req.body.productId;
        if (!productId) { return res.status(400).json({ message: 'Product ID is required' }); }


        // Check if the user already has this product in their wishlist
        let userWishlist = await Wishlist.findOne({ userId: userId });
        if (userWishlist && userWishlist.products.includes(productId)) {
            return res.status(400).json({ message: 'Product already exists in the wishlist' });
        }

        // If no wishlist exists for the user, create one
        if (!userWishlist) {
            userWishlist = new Wishlist({ userId: userId, products: [] });
        }
        userWishlist.products.push(productId);
        await userWishlist.save();

        res.status(200).json({ message: 'Product added to wishlist successfully', wishlist: userWishlist });
    } catch (error) {
        res.status(500).json({ error: 'Error adding product to wishlist', message: error.message });
    }
}



async function handleAddProductToCart(req, res) {
    try {
        // Get userId from request and productId from body
        // const email = req.userPayload.email;
        // const userFound = await User.findOne({ email: email });

        // console.log('Inside controller');
        const userId = req.userPayload.id;
        const productId = req.body.productId;
        console.log(userId, productId);
        
        if (!userId) { return res.status(400).json({ message: 'User ID is not recieved from userPayload.' }); }
        if (!productId) { return res.status(400).json({ message: 'Product ID is required' }); }


        // Find user
        const user = await User.findOne({_id: userId});
        if (!user) { return res.status(404).json({ message: 'User not found' }); }
        console.log('user found');
        

        // Find product
        const product = await Product.findOne({_id: productId})
        if (!product) { return res.status(404).json({ message: 'Invalid Product ID.' }); }
        console.log('product found');
        


        // For 1st time user, if Cart doesn't exists. Create empty cart.
        let userCart = await Cart.findOne({ userId: userId });
        if( !userCart)   { 
            console.log('inside cart');
            
            userCart = await Cart.create({ userId: userId, products: [] }); 
            userCart.products.push({productId: productId, quantity: 1});
            await userCart.save();
            return res.status(200).json({ message: 'Product added to cart successfully' });
        }

        console.log(userCart);
        

        // Check if the user has already this product in their cart,  then increase the Quantity by 1
        if (userCart && userCart.products.includes(productId)) {
            userCart.products.forEach((item, index) => {
                if (item.productId.toString() === productId) {
                    userCart.products[index].quantity++;
                    return;
                }
            });
        } else {
            userCart.products.push({productId: productId, quantity: 1});
        }
        await userCart.save();

        res.status(200).json({ message: 'Product added to cart successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error adding product to cart', message: error.message });
    }
}



// see My Orders
async function handleGetMyOrders(req, res) {
    try {
        // find user
        const user = await User.findOne( {mySponsorId: req.body.sponsorId} );
        if (!user) { return res.status(400).json({ message: 'Incorrect sponsorId.' }); }
        

        // find orders
        const order = await UserOrder.find({ 'userDetails.user': user._id });
        if (!order) { return res.status(200).json({ message: 'No orders found.' }); }

        res.status(200).json({ message: 'Orders fetched successfully', myOrders: order });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Error fetching orders', message: error.message });
    }
}




// Assign Products to users by => Admin
async function handleAssignProductsToUsersByAdmin(req, res) {
    try {
        const { mySponsorId } = req.params;
        const { products } = req.body;

        console.log(mySponsorId);
        console.log(products);
        

        // Find the user by mySponsorId
        const user = await User.findOne({ mySponsorId });
        if (!user) { return res.status(404).json({ message: 'Incorrect mySponsorId' }); }

        
        // Loop through products and check if all products are in stock.
        const assignedProducts = [];
        let totalPrice = 0;
        let totalBVPoints = 0;
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

            totalPrice += quantity * price;
            totalBVPoints += quantity * bvPoints;

            assignedProducts.push({ productId, quantity, price, bvPoints });

            // Invalidate the cached products data
            await client.del(`product:productId:${productId}`);
        }



        // Now, all the products are available with stock.
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

            // Update the Products stock.
            productFound.stock -= quantity;
            await productFound.save();
        }

        // If user isn't active, update isActive = true.
        if (user.isActive === false) {
            user.isActive = true;
            user.activeDate = new Date();
            await user.save();
        }

        // Call saveOrderDetails after assigning products
        await createUserOrder(user, totalPrice, totalBVPoints, products);
        await addPersonalBVpoints(user, totalBVPoints);
        await addBvPointsToAncestors(user, totalBVPoints);


        // Invalidate the cached products data
        await client.del('product:allProducts');

        // Respond with success
        return res.status(200).json({ message: 'Products assigned successfully to users', mySponsorId, assignedProducts, totalPrice });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}


async function createUserOrder(user, totalPrice, totalBvPoints, products) {
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
                userName: user.name,
            },
            orderDetails: {
                orderNumber: orderNumber,
                totalAmount: totalPrice,
                totalBVPoints: totalBvPoints
            },
            products: productDetails,
            deliveryMode: 'Head Office'
        });

        await order.save();
        console.log('User Order saved successfully:', order);
    } catch (error) {
        console.error('Error saving user order details:', error.message);
        throw new Error('Failed to save order details.');
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




const handleGetUserOrdersDeliveredByAdmin = async (req, res) => {
    try{
        const orders = await UserOrder.find({ "deliveryMode": "Head Office" }).sort({ "orderDetails.orderNumber": -1 });

        if (!orders || orders.length === 0) {
            return res.status(200).json({ message: 'No orders found', orders });
        }

        return res.status(200).json({ message: 'Orders fetched successfully', orders });
    }catch(err){
        console.error('Error fetching orders:', err);
        return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
}
//search product
const searchproduct = async (req, res) => {
    try {
        const query = req.query.q;
        const products = await Product.find({
            name: { $regex: query, $options: 'i' } 
        });
        return res.status(200).json({ message: 'products fetched successfully', products });
       
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
  };

//category wise search product
const category_product = async (req, res) => {
    try {
        const category = req.params.category;

        // If category is empty or undefined, return an error message
        if (!category || category.trim() === "") {
            return res.status(400).json({ message: 'Category parameter is required and cannot be empty.' });
        }

        // Log the received category for debugging
        // console.log('Received category:', category);

        // Perform a case-insensitive search within the array
        const trimmedCategory = category.trim(); // Trim any extra spaces
        console.log('Received category:', trimmedCategory);

        const products = await Product.find({
            category: { $elemMatch: { $elemMatch: { $eq: trimmedCategory } } },
        });
        // Check if products were found
        if (!products.length) {
            console.error('No products found in the category:', category);
            return res.status(404).json({ message: 'No products found in this category.' });
        }

        // Return the found products
        res.status(200).json({ message: 'Products fetched successfully', products });
    } catch (error) {
        console.error('Error fetching products by category:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};



module.exports = {
    handleAddProduct,
    handleEditProduct,
    handleDeleteProduct,
    handleViewProducts,
    handleGetProductById,
    handleClearAllRedisCache,
    handleAddProductsToCart,
    handleAddProductToWishlist,
    handleAddProductToCart,
    handleGetMyOrders,
    handleAssignProductsToUsersByAdmin,
    handleGetUserOrdersDeliveredByAdmin,
    searchproduct,
    category_product,
    
}