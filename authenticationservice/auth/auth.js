const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const UserModel = require('../models/model');
const JWTstrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;
const ValidationError = require('mongoose').Error.ValidationError
require('../services/mongo');

// // Onderstaande method in API gateway
// passport.use(
//   new JWTstrategy(
//     {
//       secretOrKey: 'TOP_SECRET',
//       jwtFromRequest: ExtractJWT.fromUrlQueryParameter('secret_token')
//     },
//     async (token, done) => {
//       try {
//         return done(null, token.user);
//       } catch (error) {
//         done(error);
//       }
//     }
//   )
// );

passport.use(
  'signup',
  new localStrategy(
    {
      usernameField: "username",
      passwordField: "password",
      passReqToCallback: true
    },
    async (req, username, password, done) => {
      try {
        const role = req.body.role;
        const result = await UserModel.findOne({username: username});

        if (result) {
          const error = new ValidationError();
          error.message = `User validation failed: username: A user with username "${username}" already exists!`;
          error.status = 400;

          done(error);
        } else {
          const user = await UserModel.create({ username, password, role}); // Plaats user in mongo db.

          return done(null, user);
        }
      } catch (error) {
        done(error);
      }
    }
  )
);

passport.use(
  'login',
  new localStrategy(
    {
      usernameField: 'username',
      passwordField: 'password'
    },
    async (username, password, done) => {
      try {
        const user = await UserModel.findOne({ username: username }); // Vind user in mongo db

        if (!user) {
          return done(null, false, { message: 'User not found' });
        }

        const validate = await user.isValidPassword(password);

        if (!validate) {
          return done(null, false, { message: 'Wrong Password' });
        }

        return done(null, user, { message: 'Logged in Successfully' });
      } catch (error) {
        return done(error);
      }
    }
  )
);