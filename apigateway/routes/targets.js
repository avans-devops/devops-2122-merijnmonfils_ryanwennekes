var express = require('express');
var router = express.Router();

router.get('/:target_id/submissions/:submission_id', function (req, res, next) {
  res.send(`Getting submission ${req.params.submission_id} on target ${req.params.target_id}`);
});

router.get('/:target_id/submissions', function (req, res, next) {
  res.send(`Getting all submissions on target ${req.params.target_id}`);
});

router.get('/', function (req, res, next) {
  res.send('Getting all targets');
});

// Post routes
router.post('/:target_id/submissions', function (req, res, next) {
  res.send(`Posting new submission on target ${req.params.target_id}`)
});

router.post('/', function (req, res, next) {
  res.send('Posting new target');
})

// Delete routes
router.delete('/:target_id/submissions/:submission_id', function(req, res, next) {
  res.send(`Deleted submission ${req.params.submission_id} from target ${req.params.target_id}`);
})

router.delete('/:target_id', function(req, res, next) {
  res.send(`Deleted target ${req.params.target_id} and its associated submissions`);
})

module.exports = router;
