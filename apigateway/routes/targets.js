var express = require('express');
var router = express.Router();
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');
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

async function callService(httpMethod, service, port, resource, data = new FormData()) {
  return new Promise((resolve, reject) => {
    axios({
      method: httpMethod,
      url: `http://${service}:${port}${resource}`,
      data: data,
      headers: data.getHeaders(),
      validateStatus: false
    })
    .then(function(response) {
      if (!(response.status >= 100 && response.status < 400)) {
        reject(response);
      }

      resolve(response);
    })
    .catch(function(error) {
      console.log(JSON.stringify(error));
      reject(error);
    });
  });
};

router.get('/:target_id/submissions/:submission_id', function (req, res, next) {
  breaker
    .fire("get", process.env.USER_SERVICE_NAME, process.env.USER_SERVICE_PORT, `/targets/${req.params.target_id}/submissions/${req.params.submission_id}`)
    .then((response) => {
      res.send(response.data)
    })
    .catch((error) => {
      next(error);
    });
});

router.get('/:target_id/submissions', function (req, res, next) {
  breaker
    .fire("get", process.env.USER_SERVICE_NAME, process.env.USER_SERVICE_PORT, `/targets/${req.params.target_id}/submissions`)
    .then((response) => {
      res.send(response.data)
    })
    .catch((error) => {
      next(error);
    });
});

router.get('/', function (req, res, next) {
  breaker
    .fire('get', process.env.USER_SERVICE_NAME, process.env.USER_SERVICE_PORT, "/targets")
    .then((response) => {
      res.send(response.data)
    })
    .catch((error) => {
      next(error);
    });
});

// Post routes
router.post('/:target_id/submissions', upload.single('image'), function (req, res, next) {
  const formData = new FormData();
  formData.append('image', fs.createReadStream(req.file.path));
  Object.keys(req.body).forEach((key) => formData.append(key, req.body[key]));

  breaker
    .fire("post", process.env.USER_SERVICE_NAME, process.env.USER_SERVICE_PORT, `/targets/${req.params.target_id}/submissions`, formData)
    .then((response) => {
      res.send(response.data)
    })
    .catch((error) => {
      next(error);
    })
    .finally(() => {
      fs.unlink(req.file.path, () => {});
    });
});

router.post('/', upload.single('image'), function (req, res, next) {
  const formData = new FormData();
  formData.append('image', fs.createReadStream(req.file.path));
  Object.keys(req.body).forEach((key) => formData.append(key, req.body[key]));

  breaker
  .fire("post", process.env.USER_SERVICE_NAME, process.env.USER_SERVICE_PORT, `/targets`, formData)  // Send the remaining body data to the user service directly.
  .then((response) => {
    res.status(200).send(response.data)
  })
  .catch((error) => {
    next(error);
  })
  .finally(() => {
    fs.unlink(req.file.path, () => {});
  });
})

// Delete routes
router.delete('/:target_id/submissions/:submission_id', function(req, res, next) {
  breaker
    .fire("delete", process.env.USER_SERVICE_NAME, process.env.USER_SERVICE_PORT, `/targets/${req.params.target_id}/submissions/${req.params.submission_id}`)
    .then((response) => {
      res.send(response.data)
    })
    .catch((error) => {
      next(error);
    });
})

router.delete('/:target_id', function(req, res, next) {
  breaker
    .fire("delete", process.env.USER_SERVICE_NAME, process.env.USER_SERVICE_PORT, `/targets/${req.params.target_id}`)
    .then((response) => {
      res.send(response.data);
    })
    .catch((error) => {
      next(error);
    });
})

module.exports = router;
