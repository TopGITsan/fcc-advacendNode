const passport = require("passport");
const bcrypt = require("bcrypt");

module.exports = function(app, db) {
  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/");
  }

  app.route("/").get((req, res) => {
    console.log("From / :  user is on home page");
    res.render(process.cwd() + "/views/pug/index", {
      title: "Home page",
      message: "login or register",
      showLogin: true,
      showRegistration: true
    });
  });

  app
    .route("/login")
    .post(
      passport.authenticate("local", { failureRedirect: "/" }),
      (req, res, next) => {
        console.log(
          "From /login :  user is on login page " + req.body.username
        );
        res.redirect("/profile");
      }
    );

  app.route("/profile").get(ensureAuthenticated, (req, res) => {
    console.log(
      "From /profile :  user is on profile page " + req.user.username
    );
    res.render(process.cwd() + "/views/pug/profile.pug", {
      username: req.user.username
    });
  });

  app.route("/register").post(
    (req, res, next) => {
      console.log("From /register :  user is tring to register ");
      db.collection("users").findOne({ username: req.body.username }, function(
        err,
        user
      ) {
        if (err) {
          next(err);
        } else if (user) {
          res.redirect("/");
        } else {
          let hash = bcrypt.hashSync(req.body.password, 12);
          console.log("From /register :  inserting a new user to db ");
          db.collection("users").insertOne(
            { username: req.body.username, password: hash },
            (err, doc) => {
              if (err) {
                res.redirect("/");
              } else {
                next(null, user);
              }
            }
          );
        }
      });
    },
    passport.authenticate("local", { failureRedirect: "/" }),
    (req, res, next) => {
      console.log("From /register , redirectig user to his profile page");
      res.redirect("/profile");
    }
  );

  app.route("/logout").get((req, res) => {
    console.log("From /logout :  user is logging out ");
    req.logout();
    res.redirect("/");
  });

  app.use((req, res, next) => {
    res
      .status(404)
      .type("text")
      .send("Not Found");
  });
};
