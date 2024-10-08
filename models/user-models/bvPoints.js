const mongoose = require('mongoose');

const weeklyEarningsSchema = new mongoose.Schema({
  week: {
    type: Date,
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
  weeklyEarnings: [weeklyEarningsSchema]
});

const BVPoints = mongoose.model('BVPoints', bvPointsSchema);

module.exports = BVPoints;