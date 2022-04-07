var express = require('express');
var router = express.Router();
require('../services/connection');
const rabbitmq = require('../services/rabbitmq');
const targetModel = require('../models/target');
const submissionModel = require('../models/submission');
const hostingServiceQueue = 'hosting-service-updater';

router.get('/:target_id/submissions/:submission_id', async function(req, res, next) {
  var submissionID = req.params.submission_id;

  try {
    var result = await submissionModel.findOne({_id: submissionID});

    if (result)
    {
      res.status(200).send(result);
    }

    return res.status(404).send(`The submission with ID ${submissionID} does not appear to exist.`);
  } catch(error) {
    next(error);
  }
});

router.get('/', async function(req, res, next) {
  try {
    var result = await targetModel.find({}).populate('submissions');

    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
});

router.post('/:target_id/submissions', async function(req, res, next) {
  try {
    var target = await targetModel.findById(req.params.target_id);
    var submission = new submissionModel(req.body);

    if (target != null) {
      submission.target = target._id;
      await submission.save();

      target.submissions.push(submission._id);
      await target.save();

      await rabbitmq.sendToQueue(hostingServiceQueue, JSON.stringify({ 
        method: "post",
        model: "submission",
        data: submission
      }));

      await rabbitmq.sendToQueue(hostingServiceQueue, JSON.stringify({ 
        method: "put",
        model: "target",
        data: target
      }));

      await rabbitmq.rpcCall({
        targetID: target._id,
        targetImage: target.image,
        submissionID: submission._id,
        submissionImage: submission.image
      });

      res.status(200).send(submission)
    }
  }
  catch(error) {
    next(error);
  }
});

router.delete('/:target_id/submissions/:submission_id', async function(req, res, next) {
  var targetID = req.params.target_id;
  var submissionID = req.params.submission_id;

  try {
    var target = await targetModel.findOne({_id: targetID});
    var submission = await submissionModel.findOne({_id: submissionID});

    if (target && submission) {
      target.submissions.pull({_id: submissionID});
      await target.save();

      await rabbitmq.sendToQueue(hostingServiceQueue, JSON.stringify({
        method: "put",
        model: "target",
        data: target
      }))

      await submissionModel.deleteOne({_id: submissionID});

      await rabbitmq.sendToQueue(hostingServiceQueue, JSON.stringify({
        method: "delete",
        model: "submission",
        data: [submission]
      }))

      res.status(200).send(`The submission with ID ${submissionID} was successfully deleted`);
    }

    res.status(404).send(`The submission with ID ${submissionID} was not found.`);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
