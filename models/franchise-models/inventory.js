const mongoose = require('mongoose');
const Franchise = require('./franchise');

const inventorySchema = mongoose.Schema({
    franchiseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Franchise',
        required: true
    },
    products : [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product'
                },
                quantity: {
                    type: Number,
                    default: 0
                },
                price: {
                    type: Number,
                    required: true
                },
                bvPoints: {type: Number},
                isAvailable: {
                    type: Boolean,
                    default: true
                }
            }
    ]
});


module.exports = mongoose.model('Inventory', inventorySchema);