const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var targetSchema = new mongoose.Schema({
  location: {
    latitude: {
      type: Number,
      min: -90,
      max: 90,
      required: true
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180,
      required: true}
  },
  radius: {
    type: Number,
    required: true,
    max: 5
  },
  image: {type: String, required: true},
  thumbsUp: {type: Number, default: 0},
  thumbsDown: {type: Number, default: 0},
  submissions: [{
    type: Schema.type.ObjectId,
    ref: "Submission"
  }]
})

module.exports = mongoose.model("Target", targetSchema);