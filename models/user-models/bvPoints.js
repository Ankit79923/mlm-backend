const mongoose = require('mongoose');


const weeklyEarningsSchema = new mongoose.Schema({
  week: {
    type: String,
    required: true
  },
  matchedBV: {
    type: Number,
    required: true,
    default: 0
  },
  payoutAmount: {
    type: Number,
    required: true,
    default: 0
  },
  carryForwardBV: {
    left: {
      type: Number,
      required: true,
      default: 0
    },
    right: {
      type: Number,
      required: true,
      default: 0
    }
  }
});


const bvPointsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  leftBV: {
    type: Number,
    required: true,
    default: 0
  },
  rightBV: {
    type: Number,
    required: true,
    default: 0
  },
  carryForwardBV: {
    left: {
      type: Number,
      required: true,
      default: 0
    },
    right: {
      type: Number,
      required: true,
      default: 0
    }
  },
  weeklyEarnings: [weeklyEarningsSchema],
  currentMonthBV: {
    leftBV: { type: Number, default: 0 },
    rightBV: { type: Number, default: 0 }
  },
  monthlyEarnings: [ 
    { 
      month: {type: String, required: true}, 
      payoutAmount: {type: Number, default: 0} 
    }
  ]
});


const BVPoints = mongoose.model('BVPoints', bvPointsSchema);

module.exports = BVPoints;