const mongoose = require('mongoose');



const bvPointsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  personalBV : {
    type: Number,
    default: 0
  },
  totalBV : {
    leftBV : {type: Number, default: 0},
    rightBV : {type: Number, default: 0}
  },
  directBV : {
    leftBV : {type: Number, default: 0},
    rightBV : {type: Number, default: 0}
  },
  currentWeekBV : {
    leftBV : {type: Number, default: 0},
    rightBV : {type: Number, default: 0}
  },
  weeklyEarnings: [
    {
      week: { type: Date, required: true},
      matchedBV: { type: Number, required: true, default: 0},
      directSalesBonus: {type: Number, require: true, default: 0},
      teamSalesBonus: {type: Number, require: true, default: 0},
      weeklyBV: {type: Number, require: true, default: 0},
      payoutAmount: { type: Number, required: true, default: 0},
      paymentStatus: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
    }
  ],
  currentMonthBV: {
    leftBV: { type: Number, default: 0 },
    rightBV: { type: Number, default: 0 }
  },
  monthlyEarnings: [ 
    { 
      month: {type: Date, required: true}, 
      payoutAmount: {type: Number, default: 0} 
    }
  ]
});


const BVPoints = mongoose.model('BVPoints', bvPointsSchema);

module.exports = BVPoints;