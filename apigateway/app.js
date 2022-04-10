var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const passport = require('passport');
const ExtractJWT = require('passport-jwt').ExtractJwt;
const bodyParser = require('body-parser');

const promBundle = require('express-prom-bundle');
const metricsMiddleware = promBundle({
  includePath: true,
  includeStatusCode: true,
  normalizePath: true,
  promClient: {
    collectDefaultMetrics: {}
  }
});

var targetsRoute = require('./routes/targets');
var submissionsRoute = require('./routes/submissions');
var authenticationRoutes = require('./routes/auth');

var app = express();
app.use(passport.initialize())

app.use((req, res, next) => {
  req.headers.authorization = req.headers.authorization;
  next();
})

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(metricsMiddleware);

app.use('/auth', authenticationRoutes);

// Voeg JWT token toe aan alle requests richting de user service.

app.use('/targets', targetsRoute);
app.use('/submissions', submissionsRoute);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.send(err.message || err.data || "An unknown error has occurred.");
});

module.exports = app;
