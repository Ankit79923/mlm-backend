const User = require('../models/users');
const Product = require('../models/products');
const Wishlist = require('../models/wishlists');
const { generateToken, verifyTokenMiddleware } = require('../middlewares/jwt');



// Add Product
async function handleAddProduct(req, res) {
    try {
        const { name, category, price, bvPoints, description, stock } = req.body;
        
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

        res.status(200).json({ message: 'Product added successfully', product: newProduct });
    } catch (error) {
        res.status(500).json({ error: 'Error adding product', message: error.message });
    }
}


// Edit product
async function handleEditProduct(req, res) {
    try {
        const updatedProduct = await Product.findByIdAndUpdate( {_id: req.params.id}, req.body, {
            new: true,          // Return the updated product
            runValidators: true // Validate fields while updating
        });
        updatedProduct.imageName = req.file.filename;
        updatedProduct.imageURL = `${req.protocol}://${req.get('host')}/public/images/uploads/${req.file.filename}`;
        await updatedProduct.save();

        if (!updatedProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.status(200).json({ message: 'Product updated successfully', product: updatedProduct });
    } catch (error) {
        console.log(error);
        console.log(error.message);
        
        res.status(500).json({ error: 'Error updating product' });
    }
}


// Delete product
async function handleDeleteProduct(req, res) {
    try {
        console.log(req.params.id);
        
        const deletedProduct = await Product.findByIdAndDelete({ _id: req.params.id });
        if (!deletedProduct) {
            console.log("Can't delete product");
            
            return res.status(404).json({ error: 'Product not found' });
        }

        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.log(error.message);
        
        res.status(500).json({ error: 'Error deleting product', message: error.message });
    }
}


// Get all products
async function handleViewProducts(req, res) {
    try {
        const products = await Product.find({});    
        res.status(200).json({ message: 'Products fetched successfully', products: products });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching products', message: error.message });
    }
}


// Get product by ID
async function handleGetProductById(req, res) {
    try { 
        const product = await Product.findById(req.params.id); 
        if (!product) { return res.status(404).send({ message: 'Product not found' }) }; 

        // Construct the full image URL 
        const imageURL = `${req.protocol}://${req.get('host')}/public/images/uploads/${product.imageUrl}`; 

        // Send response with product data and image URL 
        res.send({ name: product.name, description: product.description, imageURL: imageURL }); 
    } catch (error) { 
        console.error(error); 
        res.status(500).send({ message: 'Server error' }); 
    } 
}


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






module.exports = {
    handleAddProduct,
    handleEditProduct,
    handleDeleteProduct,
    handleViewProducts,
    handleGetProductById,
    handleAddProductsToCart,
    handleAddProductToWishlist
}