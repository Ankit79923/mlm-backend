const mongoose = require('mongoose');

const userOrderSchema = new mongoose.Schema({
  userDetails: {
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
  },
  orderDetails: {
    orderNumber: {
        type: Number,
        required: true,
        unique: true,
    },
    orderDate: {
        type: Date,
        default: Date.now,
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    totalBVPoints: {
        type: Number,
        required: true,
    }
  },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      price: {
        type: Number,
        required: true,
      },
      totalAmount: {
        type: Number,
        required: true,
      }
    },
  ]
});

module.exports = mongoose.model('FranchiseOrder', franchiseOrderSchema);