var amqp = require('amqplib/callback_api');
const connectionURI = `amqp://guest:guest@rabbitmq:5672`;
const exchange = 'upload_exchange';
const pending = 'pending_uploads';
const completed = 'completed_uploads';
const correlationID = generateUuid();
const routes = require('../routes/targets');

function generateUuid() {
  return Math.random().toString() + Math.random().toString() + Math.random().toString();
}

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

    ch.assertExchange(exchange, 'direct', {
      durable: false 
    })

    ch.assertQueue(completed, {
      exclusive: true
    }, function(error, queue) {
      if (error) {
        throw error;
      }

      ch.consume(completed, async function(message) {
        if (message.properties.correlationId == correlationID) {
          var result = JSON.parse(message.content.toString());

          routes.postTarget(result.url, result.request);
        }
      }, {
        noAck: true
      });
    })
  })
})

module.exports.uploadImage = async (image, mimetype, request) => {
  channel.sendToQueue(pending,
    Buffer.from(JSON.stringify({
      image: image,
      mimetype: mimetype,
      request: request
    })),
    {
      correlationId: correlationID,
      replyTo: completed
    }
  );
}