var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const passport = require('passport');
const JWTstrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;

passport.use(
  new JWTstrategy(
    {
      secretOrKey: process.env.SIGNATURE_KEY,
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken()
    },
    async (token, done) => {
      try {
        console.log(token);
        return done(null, token.user);
      } catch (error) {
        done(error);
      }
    }
  )
);

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
var authenticationRoutes = require('./routes/auth');

var app = express();
app.use(passport.initialize())

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(metricsMiddleware);

app.use('/targets', passport.authenticate('jwt', { session: false}), targetsRoute);
app.use('/auth', authenticationRoutes);

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
