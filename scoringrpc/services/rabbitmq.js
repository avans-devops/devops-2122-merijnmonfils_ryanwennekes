const amqp = require('amqplib/callback_api');
const messageBrokerURI = `amqp://${process.env.AMQP_USER}:${process.env.AMQP_PASSWORD}@${process.env.AMQP_SERVICE}:${process.env.AMQP_PORT}`;
const exchange = 'scoring_exchange';
const pendingScoringQueue = 'pending_scoring_queue';
const pendingBinding = 'pending';
const axios = require('axios');
const imaggaURL = 'https://api.imagga.com/v2/images-similarity/categories/personal_photos';
const similarityCalculator = require('../business/similarity-calculator');

amqp.connect(messageBrokerURI, function(err, connection) {
  if (err) {
    throw err;
  }

  connection.createChannel(function(err, channel) {
    if (err) {
      throw err;
    }

    process.on('exit', (code) => {
      channel.close();
    });

    channel.assertExchange(exchange, 'direct');

    channel.assertQueue(pendingScoringQueue, {
      durable: false
    }, (error, queue) => {
      if (error) throw error;

      channel.bindQueue(queue.queue, exchange, pendingBinding);
    });

    channel.prefetch(1);
    channel.consume(pendingScoringQueue, (message) => {
      var parsedMessage = JSON.parse(message.content.toString());

      axios({
        method: 'get',
        url: imaggaURL,
        params: {
          image_url: parsedMessage.targetImage,
          image2_url: parsedMessage.submissionImage
        },
        headers: {
          Authorization: `Basic ${process.env.IMAGGA_SIGNATURE_KEY}`
        }
      })
        .then(function(response) {
          var distance = response.data.result.distance;
          var similarity = similarityCalculator(distance);

          var result = {
            submissionID: parsedMessage.submissionID,
            submissionImage: parsedMessage.submissionImage,
            targetID: parsedMessage.targetID,
            targetImage: parsedMessage.targetImage,
            similarity: similarity
          };
  
          channel.sendToQueue(message.properties.replyTo, 
            Buffer.from(JSON.stringify(result)), {
              correlationId: message.properties.correlationId
            });
        
          channel.ack(message);
        })
        .catch((err) => {
          throw err;
        });
    });
  });
});