const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGO_URL, {
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
            dbConnection = db.db(process.env.DB_NAME || 'DevOps');
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