var express = require('express');
var router = express.Router();

router.get('/:target_id/submissions/:submission_id', function(req, res, next) {
  res.send(`Fetching submission ${req.params.submission_id} for target with ID ${req.params.target_id}`);
});

router.get('/', function(req, res, next) {
  res.send("Fetching all targets");
});

router.post('/:target_id/submissions', function(req, res, next) {
  res.send(`Posting new submission for target ${req.params.target_id}`);
});

router.delete('/:target_id/submissions/:submission_id', function(req, res, next) {
  res.send(`Deleting submission ${req.params.submission_id} from target ${req.params.target_id}`);
});

module.exports = router;
