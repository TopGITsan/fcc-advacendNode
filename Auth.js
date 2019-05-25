const passport = require("passport");
const ObjectID = require("mongodb").ObjectID;
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");

module.exports = function(app, db) {
  passport.serializeUser((user, done) => {
    console.log("From serializeUser, user is being serialized");
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    console.log("From deserializeUser, user is being checked");
    db.collection("users").findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc);
    });
  });

  passport.use(
    new LocalStrategy(function(username, password, done) {
      db.collection("users").findOne({ username: username }, function(
        err,
        user
      ) {
        console.log(
          "From local Strategy: User " + username + " attempted to log in."
        );
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false);
        }
        if (!bcrypt.compareSync(password, user.password)) {
          return done(null, false);
        }
        return done(null, user);
      });
    })
  );
};
