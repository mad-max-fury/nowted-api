const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user");
const AppError = require("../errors/appError");
const passport = require("passport");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET_KEY,
      callbackURL: "http://localhost:3001/api/v1/users/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log(profile);
      //get the user data from google
      const newUser = {
        googleId: profile.id,
        userName: profile.displayName,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        profileIcon: profile.photos[0].value || "",
        email: profile.emails[0].value,
      };

      try {
        //find the user in our database
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          //If user present in our database.
          return done(null, user);
        } else {
          // if user is not preset in our database save user data to database.
          user = await User.create(newUser);
          return done(null, user);
        }
      } catch (err) {
        return new AppError("unable to login with google", 400);
      }
    }
  )
);

// used to serialize the user for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// used to deserialize the user
passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => done(err, user));
});
