const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var submissionSchema = new mongoose.Schema({
  score: {
    type: Number,
    required: true,
    default: 0
  },
  image: {
    type: String,
    required: true
  },
  target: {
    type: Schema.Types.ObjectId,
    ref: "Target"
  },
  user: {
    _id: {
      type: Schema.Types.ObjectId,
      required: true
    },
    username: {
      type: String,
      required: true
    }
  }
})

module.exports = mongoose.model("Submission", submissionSchema);