var express = require('express');
var router = express.Router();
require('../services/mongo');
var rabbitmq = require('../services/rabbitmq');
var targetModel = require('../models/target');
var submissionModel = require('../models/submission');

router.get('/:submission_id', async (req, res, next) => {
  try {
    const result = await submissionModel.findById(req.params.submission_id);

    if (result) {
      return res.status(200).send(result);
    }

    return res.status(404).send(`Submission with ID ${req.params.submission_id} was not found!`);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const results = await submissionModel.find();

    return res.status(200).send(results);
  } catch (error) {
    next(error);
  }
});

router.put('/:submission_id', async (req, res, next) => {
  try {
    var submissionID = req.params.submission_id;
    var submission = await submissionModel.findById(submissionID);

    if (submission != null)
    {
      if (req.body.image != null) {
        return res.status(400).send("You cannot alter the image of a submission after it has been sent out!");
      }

      if (Object.keys(req.body).length == 0) {
        return res.status(400).send("No changes have been applied!");
      }

      await submissionModel.updateOne({id: submissionID}, req.body);

      return res.status(200).send(`Submission with ID ${submissionID} has been successfully updated!`);
    }

    return res.status(404).send(`Submission with ID ${submissionID} does not exist!`);
  } catch (error) {
    next(error);
  }
});

router.delete('/:submission_id', async (req, res, next) => {
  try {
    const submission = await submissionModel.findOne({_id: req.params.submission_id})

    if (submission) {
      const target = await targetModel.findOne({_id : submission.target});
      target.submissions.pull(submission);
      await target.save()

      await submissionModel.deleteOne({id: req.params.submission_id});

      return res.status(200).send(`Submission with ID ${req.params.submission_id} has been successfully deleted!`)
    }

    return res.status(404).send(`Submission with ID ${req.params.submission_id} does not exist!`);
  } catch (error) {
    next(error);
  }
});

module.exports = router;