const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); 

const franchiseSchema = mongoose.Schema({
  franchiseId: {
    type: String,
    required: true,
    unique: true,
    default: uuidv4().slice(0, 10), 
  },
  franchiseName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  contactInfo: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Franchise = mongoose.model('Franchise', franchiseSchema);

module.exports = Franchise;
