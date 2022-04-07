const mongoose = require('mongoose')
const connectionString = `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@participationdb:27017`;

console.log(connectionString);

try {
  mongoose.connect(connectionString);
}
catch (err) {
  console.log(err)
}

module.exports = mongoose.connection;