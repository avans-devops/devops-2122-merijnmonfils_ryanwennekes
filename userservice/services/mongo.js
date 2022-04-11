const mongoose = require('mongoose');
const connectionString = `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_NAME}:${process.env.DB_PORT}`;

console.log(connectionString);

try {
  mongoose.connect(connectionString);
}
catch (err) {
  console.log(err);
}



module.exports = mongoose.connection;