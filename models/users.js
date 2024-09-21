const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
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
  sponsorId: {
    type: String,
    required: true,
  },
  mySponsorId: {
    type: String,
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