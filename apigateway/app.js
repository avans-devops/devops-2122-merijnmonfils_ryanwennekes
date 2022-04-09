var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const passport = require('passport');
const JWTstrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;

passport.use('user-rule',
  new JWTstrategy(
    {
      secretOrKey: process.env.SIGNATURE_KEY,
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    },
    async (payload, done) => {
      try {
        if (payload.user.role != 'user') {
          var error = new Error();
          error.status = 401;
          error.message = 'You are not authorized to access this resource: you need to be assigned the role of "user".';

          done(error);
        }
        return done(null, payload.user);
      } catch (error) {
        done(error);
      }
    }
  )
);

passport.use('admin-rule',
  new JWTstrategy(
    {
      secretOrKey: process.env.SIGNATURE_KEY,
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    },
    async (payload, done) => {
      try {
        if (payload.user.role != 'admin') {
          var error = new Error();
          error.status = 401;
          error.message = 'You are not authorized to access this resource: you need to be assigned the role of "admin".';
          
          done(error);
        }
        return done(null, payload.user);
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

app.use('/targets', passport.authenticate('admin-rule', { session: false}), targetsRoute);
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
