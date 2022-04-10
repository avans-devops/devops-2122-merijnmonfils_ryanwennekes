var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const bodyParser = require('body-parser');

var targetsRouter = require('./routes/targets');
var submissionsRouter = require('./routes/submissions');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/targets', targetsRouter);
app.use('/submissions', submissionsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  if (err.name == "ValidationError")
  {
    return res.status(400).send(err.message); // 400 Bad Request: Mongoose voegt zelf geen status toe aan validatie errors.
  }
  
  return res.status(err.status || 500).send(err.message);
});

module.exports = app;
