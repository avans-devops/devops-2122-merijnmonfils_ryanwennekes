const { MongoClient } = require('mongodb');

const user = process.env.DB_USER
const password = process.env.DB_PASSWORD
const host = process.env.DB_HOST_NAME
const port = process.env.DB_PORT

console.log(`Database host name: ${host}`)
console.log(`Database port: ${port}`)

const client = new MongoClient(`mongodb://${user}:${password}@${host}:${port}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

let dbConnection;

module.exports = {
  client: client,
  getDb: async function () {
    return new Promise((resolve, reject) => {
      if (!dbConnection) {
        console.log('Opening connection');
        client.connect(function (err, db) {
          if (err) {
            reject(err);
          }

          if (db) {
            dbConnection = db.db(process.env.DB_NAME);
            console.log('Successfully connected to MongoDB.');
            resolve(dbConnection);
          } else {
            console.log('No DB found?');
          }
        });
      } else {
        resolve(dbConnection);
      }
    });
  }
};