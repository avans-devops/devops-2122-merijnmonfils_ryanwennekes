
require('dotenv').config();
const amqp = require('amqplib/callback_api');
const connectionURI = `amqp://guest:guest@rabbitmq:5672`;
const exchange = 'upload_exchange';
const pending = "pending_uploads";
const completed = "completed_uploads";
const cloudinary = require('cloudinary').v2;
const axios = require('axios');
const fs = require('fs');

amqp.connect(connectionURI, function(err, connection) {
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

    channel.assertExchange(exchange, 'direct', {
      durable: false
    });

    channel.assertQueue(pending, {
      durable: false
    })

    channel.prefetch(1);
    channel.consume(pending, (message) => {
      var result = JSON.parse(message.content.toString());

      var base64Image = `data:${result.mimetype};base64,${result.image}`;
      cloudinary.uploader
        .upload(base64Image, {
          resource_type: 'image' 
        })
        .then((response) => {
          channel.sendToQueue(message.properties.replyTo, 
            Buffer.from(JSON.stringify({
              url: response.url,
              request: result.request
            })), {
              correlationId: message.properties.correlationId
          });
        
          channel.ack(message);
        })
        .catch((error) => {
          console.log(error);
        });
    });
  })
});