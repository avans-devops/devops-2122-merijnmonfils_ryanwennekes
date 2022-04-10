var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const passport = require('passport');
const JWTstrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;
const bodyParser = require('body-parser');

passport.use('user-rule',
  new JWTstrategy(
    {
      secretOrKey: process.env.JWT_SIGNATURE_KEY,
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
      secretOrKey: process.env.JWT_SIGNATURE_KEY,
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

var targetsRouter = require('./routes/targets');
var submissionsRouter = require('./routes/submissions');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const payload = ExtractJWT.fromAuthHeaderAsBearerToken();
  req.user = payload.user;
  next();
})

app.use('/targets', passport.authenticate('user-rule', {session: false}), targetsRouter);
app.use('/submissions',passport.authenticate('user-rule', {session: false}), submissionsRouter);

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
