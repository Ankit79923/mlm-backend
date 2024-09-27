const User = require('../models/users');
const Product = require('../models/products');
const Wishlist = require('../models/wishlists');
const { generateToken, verifyTokenMiddleware } = require('../middlewares/jwt');



// Add Product - done
async function handleAddProduct(req, res) {
    try {
        const { name, category, price, bvPoints, description, stock } = req.body;
        if(!name || !category || !price || !bvPoints || !description || !stock) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
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


// Edit product - done
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
        
        res.status(200).json({ message: 'Product updated successfully', product: updatedProduct });
        
    } catch (error) {
        console.log(error);
        console.log(error.message); 
        res.status(500).json({ error: 'Error updating product' });
    }
}


// Delete product - done
async function handleDeleteProduct(req, res) {
    try {        
        const deletedProduct = await Product.findByIdAndDelete({ _id: req.params.id });
        if (!deletedProduct) {
            console.log("Can't delete product"); 
            return res.status(404).json({ error: 'Product not found' });
        }

        // Delete related wishlist items
        // await Wishlist.deleteMany({ productId: req.params.id });

        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.log(error.message);
        
        res.status(500).json({ error: 'Error deleting product', message: error.message });
    }
}


// Get all products - done
async function handleViewProducts(req, res) {
    try {
        const products = await Product.find({});    
        if(!products) { return res.status(404).json({ message: 'Products not found' }) };

        res.status(200).json({ message: 'Products fetched successfully', products: products });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching products', message: error.message });
    }
}


// Get product by ID - done
async function handleGetProductById(req, res) {
    try { 
        const product = await Product.findById(req.params.id); 
        if (!product) { return res.status(404).send({ message: 'Product not found' }) }; 

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






module.exports = {
    handleAddProduct,
    handleEditProduct,
    handleDeleteProduct,
    handleViewProducts,
    handleGetProductById,
    handleAddProductsToCart,
    handleAddProductToWishlist
}