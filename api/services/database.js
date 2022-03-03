const { MongoClient } = require('mongodb');

const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const host = process.env.DB_HOST_NAME;
const port = process.env.DB_PORT;
const name = process.env.DB_NAME;

var clientConnectionString = '';
var databaseName = '';

if (process.env.JEST) {
  clientConnectionString = global.__MONGO_URI__;
  databaseName = global.__MONGO_DB_NAME__;
} else {
  clientConnectionString = `mongodb://${user}:${password}@${host}:${port}`;
  databaseName = name;
};

const client = new MongoClient(clientConnectionString, {
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
            dbConnection = db.db(databaseName);
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