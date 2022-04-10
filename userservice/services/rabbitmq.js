require('../services/mongo');
const amqp = require('amqplib/callback_api');
const messageBrokerURI = `amqp://${process.env.AMQP_USER}:${process.env.AMQP_PASSWORD}@${process.env.AMQP_SERVICE}:${process.env.AMQP_PORT}`;
const exchange = "scoring_exchange";
const pendingScoringQueue = "pending_scoring_queue";
const completedScoringQueue = "completed_scoring_queue";
const completedBinding = "completed";
const correlationID = "sent_from_user_service";
const submission = require('../models/submission');

ch = null;

amqp.connect(messageBrokerURI, function(error, connection) {
  if (error)
  {
    throw error;
  }

  connection.createChannel(function(error, channel) {
    if (error)
    {
      throw error;
    }

    ch = channel;

    process.on('exit', (code) => {
      channel.close();
    });

    channel.assertExchange(exchange, 'direct');

    channel.assertQueue(pendingScoringQueue, {
      durable: false
    }, function(error, queue) {
      if (error) {
        throw error;
      }
    })

    channel.assertQueue(completedScoringQueue, {
      exclusive: false
    }, function(error, queue) {
      if (error) {
        throw error;
      }

      channel.bindQueue(queue.queue, exchange, completedBinding);
      channel.consume(queue.queue, async function(message) {
        if (message.properties.correlationId == correlationID) {
          console.log(message.content.toString());
          await RPCResponse(JSON.parse(message.content));
        }
      }, {
        noAck: true
      });
    })
  })
})

async function RPCResponse(message) {
  console.log(message);
  try {
    await submission.updateOne({_id: message.submissionID}, {score: message.similarity});
  } catch (error) {
    throw error;
  }
}

module.exports.RPCRequest = async (message) => {
  ch.sendToQueue(pendingScoringQueue,
    Buffer.from(JSON.stringify(message)),
    {
      correlationId: correlationID,
      replyTo: completedScoringQueue
    }
  );
}