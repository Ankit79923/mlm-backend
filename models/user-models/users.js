const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


const userSchema = new mongoose.Schema({
  sponsorId: {
    type: String,
    required: true,
  },
  registrationType: {
    type: String,
    enum: ['Individual', 'Business Entity'], // Registration Type
    required: true,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Others'], // Gender selection
    required: true,
  },
  name: {
    type: String, // Preferred Customer Name
    required: true,
  },
  dob: {
    type: Date, // Date of Birth
    required: true,
  },
  mobileNumber: {
    type: String, // Mobile Number
    required: true,
  },
  whatsappNumber: {
    type: String, // WhatsApp Number (optional)
  },
  email: {
    type: String, // Email ID
    required: true,
    unique: true,
  },
  state: {
    type: String, // Select State
    required: true,
  },
  district: {
    type: String, // Select District
    required: true,
  },
  pincode: {
    type: Number, // Pincode
    required: true,
  },
  address: {
    type: String, // Address
    required: true,
  },
  gstNumber: {
    type: String // GST Number (optional)
  },
  password: {
    type: String, // Password
    required: true
  },
  // ---------------------------------------------------------------------------------------------------------------------
  parentSponsorId: {
    type: String,
    default: null,
  },
  mySponsorId: {
    type: String,
    required: true,
  },
  leftRefferalLink: {
    type: String,
    required: true,
  },
  rightRefferalLink: {
    type: String,
    required: true,
  },
  binaryPosition: {
    left: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Binary positions refer to other users
    },
    right: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Binary positions refer to other users
    }
  },
  bvPoints: {
    type: Number,
    default: 0,
  },
  // ---------------------------------------------------------------------------------------------
  productsPurchased: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      date: {
        type: Date,
        default: Date.now,
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});




userSchema.pre('save', async function(next) {
    const user = this;
    if(!user.isModified('password')) next();

    try{
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        user.password = hashedPassword;
        next();
    }catch(err){
        console.log('Error: '+ err);
        next(err);
    }
});




userSchema.methods.comparePassword = async function(candidatePassword){
    try{
        const isMatch = await bcrypt.compare(candidatePassword, this.password);
        return isMatch;
    }catch(err){
        throw err;
    }
};



const User = mongoose.model('User', userSchema);
module.exports = User;