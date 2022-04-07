var amqp = require('amqplib/callback_api');
const target = require('../models/target');
const submission = require('../models/submission');
const connectionURI = `amqp://guest:guest@rabbitmq:5672`;
const synchronizationExchange = 'synchronization-exchange';
const hostingServiceQueue = 'hosting-service-updater';
const participationServiceQueue = 'participation-service-updater';
const rpcResponseQueue = 'rpc_response_queue';
const rpcCorrelationID = generateUuid();

channel = null;

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

    channel = ch;

    process.on('exit', (code) => {
      channel.close();
    });

    ch.assertExchange(synchronizationExchange, 'direct', {
      durable: false
    })

    ch.assertQueue(hostingServiceQueue, {
      durable: false
    }, function(err, queue) {
      if (err) {
        throw err;
      }

      ch.bindQueue(queue.queue, synchronizationExchange, hostingServiceQueue);
    });

    ch.assertQueue(participationServiceQueue, {
      durable: false
    }, function(err, queue) {
      if (err) {
        throw err;
      }

      ch.bindQueue(queue.queue, synchronizationExchange, participationServiceQueue);
    });

    ch.consume(participationServiceQueue, async function(message) {
      console.log(`Received a message from ${synchronizationExchange} queue ${participationServiceQueue}: ${message.content.toString()}`);
      await processMessage(JSON.parse(message.content));
    }, {
      noAck: true
    });

    ch.assertQueue(rpcResponseQueue, {
      exclusive: true
    }, function(error, queue) {
      if (error) {
        throw error;
      }

      ch.consume(queue.queue, async function(message) {
        if (message.properties.correlationId == rpcCorrelationID) {
          await processRPCCall(JSON.parse(message.content));
        }
      }, {
        noAck: true
      });
    })
  })
})

async function processRPCCall(message) {
  try {
    submission.updateOne({_id: message.submissionID}, {score: message.similarity});
  } catch (error) {
    throw error;
  }
}

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
    
    // GET slaat nergens op in deze context.
  }
}

function generateUuid() {
  return Math.random().toString() + Math.random().toString() + Math.random().toString();
}

module.exports.rpcCall = async (message) => {
  channel.sendToQueue('rpc_queue',
    Buffer.from(JSON.stringify(message)),
    {
      correlationId: rpcCorrelationID,
      replyTo: rpcResponseQueue
    }
  );
}

module.exports.sendToQueue = async (queueName, data) => {
  channel.publish(synchronizationExchange, queueName, Buffer.from(data));
}