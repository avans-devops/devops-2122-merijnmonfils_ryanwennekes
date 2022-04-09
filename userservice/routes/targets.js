require('dotenv');
var express = require('express');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
var router = express.Router();
require('../services/mongo');
var rabbitmq = require('../services/rabbitmq');
var targetModel = require('../models/target');
var submissionModel = require('../models/submission');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

router.get('/:target_id/submissions/:submission_id', async function(req, res, next) {
  var submissionID = req.params.submission_id;

  try {
    var result = await submissionModel.findOne({_id: submissionID});

    if (result)
    {
      return res.status(200).send(result);
    }

    return res.status(404).send(`The submission with ID ${submissionID} does not appear to exist.`);
  } catch(error) {
    next(error);
  }
});

router.get('/:target_id/submissions', async function(req, res, next) {
  var targetID = req.params.target_id;

  try {
    var result = await targetModel.findById(targetID).populate('submissions').select('submissions -_id');
    
    if (result != null)
    {
      return res.status(200).send(result.submissions)
    } else {
      const notFoundError = new Error(`Target with ID ${targetID} does not exist.`);
      notFoundError.status = 404;

      throw notFoundError;
    }
  }
  catch(error) {
    next(error);
  }
});

router.get('/', async function(req, res, next) {
  try {
    var result = await targetModel.find({}).populate('submissions');

    return res.status(200).send(result);
  } catch (error) {
    next(error);
  }
});

router.post('/:target_id/submissions', upload.single('image'), async function(req, res, next) {
  try {
    cloudinary.uploader
      .upload(req.file.path, {
        resource_type: 'image' 
      })
      .then(async (response) => {
        var target = await targetModel.findById(req.params.target_id);
        var submission = new submissionModel(req.body);
        submission.image = response.url;

        if (target != null) {
          submission.target = target._id;
          await submission.save();

          target.submissions.push(submission._id);
          await target.save();

          rabbitmq.RPCRequest({
            submissionID: submission._id,
            targetID: target._id,
            submissionImage: submission.image,
            targetImage: target.image
          });

          return res.status(200).send("Your submission has been sent to the queue for score comparison!");
        }
      })
      .catch((error) => {
        next(error);
      })
      .finally(() => {
        fs.unlink(req.file.path, () => {});
      });
    } catch(error) {
      next(error);
    }
});

router.post('/', upload.single('image'), async function(req, res, next) {
  try {
    cloudinary.uploader
      .upload(req.file.path, {
        resource_type: 'image' 
      })
      .then(async (response) => {
        const target = new targetModel(req.body);
        target.image = response.url;

        await target.save();

        return res.status(200).send(target);
      })
      .catch((error) => {
        next(error);
      })
      .finally(() => {
        fs.unlink(req.file.path, () => {});
      });
  } catch (error) {
    fs.unlink(req.file.path, () => {});
    next(error);
  }
})

router.delete('/:target_id/submissions/:submission_id', async function(req, res, next) {
  var targetID = req.params.target_id;
  var submissionID = req.params.submission_id;

  try {
    var target = await targetModel.findOne({_id: targetID});
    var submission = await submissionModel.findOne({_id: submissionID});

    if (target && submission) {
      target.submissions.pull({_id: submissionID});
      await target.save();
      await submissionModel.deleteOne({_id: submissionID});

      res.status(200).send(`The submission with ID ${submissionID} was successfully deleted`);
    }

    res.status(404).send(`The submission with ID ${submissionID} was not found.`);
  } catch (error) {
    next(error);
  }
});

router.delete('/:target_id', async function(req, res, next) {
  var targetId = req.params.target_id;

  try {
    var target = await targetModel.findById(targetId);

    if (target != null)
    {
      await targetModel.deleteOne({_id: target._id});
      await submissionModel.deleteMany({_id: {$in: target.submissions}})

      return res.status(200).send(`Target with ID ${targetId} and its submissions have been successfully removed`);
    }

    const notFoundError = new Error(`Target with ID ${targetId} does not exist.`);
    notFoundError.status = 404;

    next(notFoundError);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
