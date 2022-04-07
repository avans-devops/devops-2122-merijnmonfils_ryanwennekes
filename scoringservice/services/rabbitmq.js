const amqp = require('amqplib/callback_api');
const connectionURI = `amqp://guest:guest@rabbitmq:5672`;
const queue = "rpc_queue";
require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const axios = require('axios');

amqp.connect(connectionURI, function(err, connection) {
  if (err) {
    throw err;
  }

  console.log(`Connected to rpc channel`);

  connection.createChannel(function(err, channel) {
    if (err) {
      throw err;
    }

    channel.assertQueue(queue, {
      durable: false
    })

    channel.prefetch(1);
    channel.consume(queue, (message) => {
      var parsedMessage = JSON.parse(message.content.toString());

      // Upload target image TODO: voeg url veld toe
      cloudinary.uploader
        .upload(parsedMessage.targetImage, {
          resource_type: "image"
        })
        .then((targetResult) => {
          var targetImageUrl = targetResult.url;
          
          // Upload submission image.
          cloudinary.uploader
            .upload(parsedMessage.submissionImage, {
              resource_type: "image"
            })
            .then((submissionResult) => {
              var submissionImageUrl = submissionResult.url

              axios({
                method: "get",
                url: "https://api.imagga.com/v2/images-similarity/categories/personal_photos",
                params: {
                  image_url: targetImageUrl,
                  image2_url: submissionImageUrl
                },
                headers: {
                  Authorization: 'Basic YWNjXzYyNzMzZjBhODk1OWU4Zjo2ZWE3N2M0NGU0YjdjNDQ4Y2Q5MTU5ODE1MTJjZDU4MQ=='
                }
              })
              .then(function(response) {
                console.log(`IMAGGA res: ${JSON.stringify(response.data)}`);
                var result = {
                  submissionID: parsedMessage.submissionID,
                  submissionURL: submissionImageUrl,
                  targetID: parsedMessage.targetID,
                  targetURL: targetImageUrl,
                  similarity: response.data.result.distance
                }
          
                channel.sendToQueue(message.properties.replyTo, 
                    Buffer.from(JSON.stringify(result)), {
                      correlationId: message.properties.correlationId
                  });
                
                channel.ack(message);
              })
              .catch(function(error) {
                throw error;
              });
            })
            .catch((error) => {
              throw error;
            });
        })
        .catch((error) => {
          throw error;
        });
    });
  })
});