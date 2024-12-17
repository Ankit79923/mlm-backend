const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); 
const bcrypt = require('bcrypt');


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
  address: {
    type: String,
    required: true,
  },
  state:{
    type: String,
    required: true,
  },
  district:{
    type: String,
    required: true,
  },
  pincode:{
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});





// franchiseSchema.pre('save', async function(next) {
//   const user = this;
//   if(!user.isModified('password')) next();

//   try{
//       const salt = await bcrypt.genSalt(10);
//       const hashedPassword = await bcrypt.hash(user.password, salt);
//       user.password = hashedPassword;
//       next();
//   }catch(err){
//       console.log('Error: '+ err);
//       next(err);
//   }
// });






franchiseSchema.methods.comparePassword = async function(candidatePassword){
  try{
      const isMatch = await bcrypt.compare(candidatePassword, this.password);
      return isMatch;
  }catch(err){
      throw err;
  }
};



const Franchise = mongoose.model('Franchise', franchiseSchema);
module.exports = Franchise;


