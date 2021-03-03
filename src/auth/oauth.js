const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const UserModel = require("../services/users/schema");
const { authenticate } = require("./tools");

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      callbackURL: "http://localhost:9999/users/googleRedirect",
    },
    async (request, accessToken, refreshToken, profile, next) => {
        
      const newUser = {
        googleId: profile.id,
        email: profile.emails[0].value,
        userName: profile.name.givenName,
        refreshTokens: [],
      };
      try {
        const user = await UserModel.findOne({ googleId: profile.id });

        if (user) {
           
          const tokens = await authenticate(user);
          next(null, { user, tokens });
        } else {
            console.log("---------User-------")
          const createdUser = new UserModel(newUser);
          await createdUser.save();
          const tokens = await authenticate(createdUser);
          next(null, { user: createdUser, tokens });
        }
      } catch (error) {
        next(error);
      }
    }
  )
);

passport.serializeUser(function (user, next) {
  next(null, user);
});