const amqp = require('amqplib/callback_api');
const connectionURI = `amqp://guest:guest@rabbitmq:5672`;
const exchange = 'synchronization-exchange';
const hostingServiceQueue = 'hosting-service-updater';
const participationServiceQueue = 'participation-service-updater';

const target = require('../models/target');
const submission = require('../models/submission');

var channel = null;
amqp.connect(connectionURI, function(err, conn) {
  if (err)
  {
    throw err;
  }

  conn.createChannel(function(err, ch) {
    if (err)
    {
      throw err;
    }

    process.on('exit', (code) => {
      ch.close();
    });

    channel = ch;

    ch.assertExchange(exchange, 'direct', {durable: false});
    ch.assertQueue(hostingServiceQueue, {
      durable: false
    }, function(err, queue) {
      if (err) {
        throw err;
      }

      ch.bindQueue(queue.queue, exchange, hostingServiceQueue);
    });
    ch.assertQueue(participationServiceQueue, {
      durable: false
    }, function(err, queue) {
      if (err) {
        throw err;
      }

      ch.bindQueue(queue.queue, exchange, participationServiceQueue);
    });

    ch.consume(hostingServiceQueue, async function(message) {
      console.log(`Received a message from ${exchange} queue ${hostingServiceQueue}: ${message.content.toString()}`);
      await processMessage(JSON.parse(message.content));
    }, {
      noAck: true
    });
  })
});

async function processMessage(message) {
  var model = null;

  switch (message.model) {
    case "target":
      model = target;

      break;
    default:
      // submission
      model = submission;
  }

  switch (message.method) {
    case "post":
      await model.create(message.data);

      break;
    case "delete":
      await model.deleteMany({_id: {$in: message.data}});

      break;
    default:
      await model.updateOne({_id: message.data._id}, message.data, {
        upsert: true
      });
  }
}

module.exports.sendToQueue = async (queueName, data) => {
  channel.publish(exchange, queueName, Buffer.from(data));
}