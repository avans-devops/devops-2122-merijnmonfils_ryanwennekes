var express = require('express');
const axios = require('axios');
var router = express.Router();

// Circuit breaker
const circuitBreaker = require('opossum');
const options = {
  timeout: 10000,
  errorThresholdPercentage: 100,
  resetTimeout: 1
}
const breaker = new circuitBreaker(callService, options);

breaker.fallback(() => "De hosting service kon niet op tijd worden aangeroepen.");
breaker.on("fallback", (result) => {
  console.log(result);
});

async function callService(httpMethod, service, port, resource, data = null) {
  return new Promise((resolve, reject) => {
    axios({
      method: httpMethod,
      url: `http://${service}:${port}${resource}`,
      data: data,
      validateStatus: false // We willen niet dat Axios zelf errors throwt bij bijvoorbeeld een 404. Dit willen we juist oplossen in de generieke error handler.
    })
    .then(function(response) {
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
      res.send("De service kon niet op tijd bereikt worden."); // TODO: Ensure that this is handled decently.
    });
});

router.get('/:target_id/submissions', function (req, res, next) {
  breaker
    .fire("get", "hostingservice", 3001, `/targets/${req.params.target_id}/submissions`)
    .then((response) => {
      res.status(response.status);
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
      res.send("De service kon niet op tijd bereikt worden."); // TODO: Ensure that this is handled decently.
    });
});

// Post routes
router.post('/:target_id/submissions', function (req, res, next) {
  breaker
    .fire("post", "participationservice", 3002, `/targets/${req.params.target_id}/submissions`)
    .then((response) => {
      res.send(response.data)
    })
    .catch((error) => {
      res.send("De service kon niet op tijd bereikt worden."); // TODO: Ensure that this is handled decently.
    });
});

router.post('/', function (req, res, next) {
  breaker
    .fire("post", "hostingservice", 3001, `/targets`, req.body)
    .then((response) => {
      res.status(response.status);
      res.send(response.data)
    })
    .catch((error) => {
      next(error);
    });
})

// Delete routes
router.delete('/:target_id/submissions/:submission_id', function(req, res, next) {
  breaker
    .fire("delete", "participationservice", 3002, `/targets/${req.params.target_id}/submissions/${req.params.submission_id}`)
    .then((response) => {
      res.send(response.data)
    })
    .catch((error) => {
      res.send("De service kon niet op tijd bereikt worden."); // TODO: Ensure that this is handled decently.
    });
})

router.delete('/:target_id', function(req, res, next) {
  breaker
    .fire("delete", "hostingservice", 3001, `/targets/${req.params.target_id}`)
    .then((response) => {
      res.status(response.status);
      res.send(response.data);
    })
    .catch((error) => {
      next(error);
    });
})

module.exports = router;
