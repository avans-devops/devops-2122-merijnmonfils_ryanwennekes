const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var submissionSchema = new mongoose.Schema({
  score: {
    type: Number,
    required: false
  }, // False, want het berekenen van de score wordt gedaan door een autonome service.
  image: {
    type: String,
    required: true
  },
  target: {
    type: Schema.type.ObjectId,
    ref: "Target"
  }
})

module.exports = mongoose.model("Submission", submissionSchema);