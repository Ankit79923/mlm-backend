const razorpay = require('../utils/razorpay.js');
const Payment = require('../models/payment.js');
const User = require('../models/users.js');
const Product = require('../models/products.js');



// reedem Bv Points
const handleReedemBvPoints = async (req, res) => {
    try{
        const userId = req.params.userId;
        const productId = req.params.productId;

        // Find user
        const userFound = await User.findOne({_id: userId});
        if(!userFound) { return res.status(404).json({message: 'User not found'}) };

        // Find product
        const productFound = await Product.findOne({_id: productId});
        if(!productFound) { return res.status(404).json({message: 'Product not found'}) };

        // Check if user has enough Bv Points
        if(userFound.bvPoints < productFound.bvPoints) { 
            return res.status(400).json( {message: 'Insufficient Bv Points'} ); 
        }

        // calculate final price & update bv points
        const finalPrice = productFound.price - productFound.bvPoints;
        userFound.bvPoints -= productFound.bvPoints;
        await userFound.save();
        
        return res.status(200).json({message: 'Successfully reedemed Bv Points', finalPrice: finalPrice});
    } catch(error){
        console.log('Error occured during reedeming BvPoints');
        res.status(500).json({ message: 'Error reedeming BvPoints', error: error.message });
    }
}





// router.post('/create/orderId', );
// Create a new order & save it to the database
const handleCreateOrderId = async (req, res) => {                          // This will create a new orderId & it will send it to the frontend.
    try {
        const options = {
            // amount: 5000 * 100, // amount in smallest currency unit
            amount: Number(req.body.amount * 100),
            currency: "INR",
        };
        const order = await razorpay.orders.create(options);
        const newPayment = await Payment.create({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            status: 'pending',
        });
        res.status(200).json(order);        
    } catch (error) {
        console.log('Error occured during creating order');
        res.status(500).json({ message: 'Error creating order', error: error.message });
    }
}




// router.post('/api/payment/verify')
// Payment verification status
const handlePaymentVerification =  async (req, res) => {
    try {
        const { razorpayOrderId, razorpayPaymentId, signature } = req.body;
        const secret = process.env.RAZORPAY_KEY_SECRET
        const { validatePaymentVerification } = require('../node_modules/razorpay/dist/utils/razorpay-utils.js')
        const result = validatePaymentVerification({ "order_id": razorpayOrderId, "payment_id": razorpayPaymentId }, signature, secret);
        if (result) {
            const payment = await Payment.findOne({ orderId: razorpayOrderId });
            payment.paymentId = razorpayPaymentId;
            payment.signature = signature;
            payment.status = 'completed';
            await payment.save();
            res.json({ status: 'success' });
        } else {
            res.status(400).send('Invalid signature');
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Error verifying payment');
    }
}







module.exports = {
    handleReedemBvPoints,
    handleCreateOrderId,
    handlePaymentVerification
}
