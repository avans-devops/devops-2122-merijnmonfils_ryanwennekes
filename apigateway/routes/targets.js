var express = require('express');
var router = express.Router();
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');
const rabbitmq = require('../services/rabbitmq');
const upload = multer({ dest: 'uploads/' });

// Axios
const axios = require('axios');

// Circuit breaker
const circuitBreaker = require('opossum');
const options = {
  timeout: 10000,
  errorThresholdPercentage: 100,
  resetTimeout: 1
}
const breaker = new circuitBreaker(callService, options);

async function callService(httpMethod, service, port, resource, data = null, contentType = 'application/json') {
  return new Promise((resolve, reject) => {
    axios({
      method: httpMethod,
      url: `http://${service}:${port}${resource}`,
      data: data,
      headers: {
        'Content-Type': contentType
      },
      validateStatus: false
    })
    .then(function(response) {
      if (!(response.status >= 100 && response.status < 400)) {
        reject(response);
      }

      resolve(response);
    })
    .catch(function(error) {
      reject(error);
    });
  });
};

router.get('/:target_id/submissions/:submission_id', function (req, res, next) {
  breaker
    .fire("get", "participationservice", 3002, `/targets/${req.params.target_id}/submissions/${req.params.submission_id}`)
    .then((response) => {
      res.send(response.data)
    })
    .catch((error) => {
      next(error);
    });
});

router.get('/:target_id/submissions', function (req, res, next) {
  breaker
    .fire("get", "hostingservice", 3001, `/targets/${req.params.target_id}/submissions`)
    .then((response) => {
      res.send(response.data)
    })
    .catch((error) => {
      next(error);
    });
});

router.get('/', function (req, res, next) {
  breaker
    .fire("get", "participationservice", 3002, "/targets")
    .then((response) => {
      res.send(response.data)
    })
    .catch((error) => {
      next(error);
    });
});

// Post routes
router.post('/:target_id/submissions', function (req, res, next) {
  breaker
    .fire("post", "participationservice", 3002, `/targets/${req.params.target_id}/submissions`, req.body)
    .then((response) => {
      res.send(response.data)
    })
    .catch((error) => {
      next(error);
    });
});

router.post('/', upload.single('image'), function (req, res, next) {
  // var file = fs.readFileSync(req.file.path);
  // // Stuur request door naar hosting service met content type multipart-formdata
  // // Deze valideert, geeft een response terug
  // var imageBase64 = Buffer.from(file).toString('base64');
  // var request = req.body;

  // rabbitmq.uploadImage(imageBase64, req.file.mimetype, request);

  // res.status(200).send("Target has been sent for submission");
  var formData = new FormData();
  Object.keys(req.body).forEach((key) => formData.append(key, req.body[key]));
  formData.append("image", fs.readFileSync(req.file.path));

  console.log(formData);

  breaker
    .fire("post", "hostingservice", 3001, `/targets`, formData, 'multipart/form-data')  // Send the remaining body data to the hosting service directly.
    .then((response) => {
      res.status(200).send(response.data)
    })
    .catch((error) => {
      next(error);
    });
})

// URL has been generated, now the request can be sent to the hosting service.
module.exports.postTarget = (url, request) => {
  request.image = url;

  breaker
    .fire("post", "hostingservice", 3001, `/targets`, request)  // Send the remaining body data to the hosting service directly.
    .then((response) => {
      res.send(response.data)
    })
    .catch((error) => {
      next(error);
    });
}

// Delete routes
router.delete('/:target_id/submissions/:submission_id', function(req, res, next) {
  breaker
    .fire("delete", "participationservice", 3002, `/targets/${req.params.target_id}/submissions/${req.params.submission_id}`)
    .then((response) => {
      res.send(response.data)
    })
    .catch((error) => {
      next(error);
    });
})

router.delete('/:target_id', function(req, res, next) {
  breaker
    .fire("delete", "hostingservice", 3001, `/targets/${req.params.target_id}`)
    .then((response) => {
      res.send(response.data);
    })
    .catch((error) => {
      next(error);
    });
})

module.exports = router;
