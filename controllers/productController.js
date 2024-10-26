const User = require('../models/user-models/users');
const Product = require('../models/admin-models/products');
const Wishlist = require('../models/user-models/wishlists');
const { generateToken, verifyTokenMiddleware } = require('../middlewares/jwt');
const client = require('../config/redis');



// 1. Add Product - done
async function handleAddProduct(req, res) {
    try {
        console.log('Inside function');
        console.log(req.body);
        
        const { name, category, price, bvPoints, description, stock } = req.body;
        if(!name || !category || !price || !bvPoints || !description || !stock) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        console.log("1");
        const newProduct = await Product.create({
            name,
            category,
            price,
            bvPoints,
            imageName: req.file.filename,
            imageURL: `${req.protocol}://${req.get('host')}/public/images/uploads/${req.file.filename}`,
            description,
            stock
        });

        console.log('2');
        
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
        Object.assign(updatedProduct, req.body);
        console.log(req.body);
        
        
        // Only update image fields if a file was uploaded
        if (req.file) {
            updatedProduct.imageName = req.file.filename;
            updatedProduct.imageURL = `${req.protocol}://${req.get('host')}/public/images/uploads/${req.file.filename}`;
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
        // const orders = await Order.find({ userId: userId });
        // if (!orders) { return res.status(404).json({ message: 'No orders found for this user.' }); }

        // console.log(user);
        

        res.status(200).json({ message: 'Orders fetched successfully', myOrders: user.productsPurchased });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Error fetching orders', message: error.message });
    }
}


module.exports = {
    handleAddProduct,
    handleEditProduct,
    handleDeleteProduct,
    handleViewProducts,
    handleGetProductById,
    handleAddProductsToCart,
    handleAddProductToWishlist,
    handleAddProductToCart,
    handleGetMyOrders
}