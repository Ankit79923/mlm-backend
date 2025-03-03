const mongoose = require('mongoose');
const rankachiverSchema = mongoose.Schema({
  rank: {
    type: String,
    required: true
},

 
users: [{
  objectId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      auto: true
  },
  name: {
      type: String,
      required: true
  },
  userId: {
      type: String,
      required: true,
      unique: true
  },
  isclaimed:{
    type: Boolean,
    default: false
  }
 
  
}]
});

module.exports = mongoose.model('Rankachiver', rankachiverSchema);