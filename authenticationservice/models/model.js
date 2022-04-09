const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: {
    type: String,
    minlength: [3, 'Username must be at least 3 characters!'],
    maxlength: [20, 'Username cannot exceed 20 characters!'],
    required: [true, 'Username is a required field!']
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    validate: {
      validator: (value) => {
        return value == "user" || value == "admin";
      },
      message: (properties) => {
        return `"${properties.value}" is not a valid user account type! Specify either "user" or "admin".`
      }
    },
    required: [true, 'The "role" property is required!']
  }
});

UserSchema.pre(
  'save',
  async function(next) {
    const user = this;
    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;
    next();
  }
);

UserSchema.methods.isValidPassword = async function(password) {
  const user = this;
  const compare = await bcrypt.compare(password, user.password);

  return compare;
}

const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;