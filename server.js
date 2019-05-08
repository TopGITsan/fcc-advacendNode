'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const mongodb     = require('mongodb');
const session     = require('express-session');
const passport    = require('passport');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');

const app = express();

app.set('view engine','pug');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true
}));

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(passport.initialize());
app.use(passport.session());

const ObjectID = mongodb.ObjectID;
const mongo = mongodb.MongoClient;

mongo.connect(process.env.DATABASE,(err, db)=>{
  if (err){
    console.log('Database error: '+ err);
  } else {
    console.log('Successful connected to the database');

    passport.serializeUser((user, done)=>{
      done(null, user._id);
    });

    passport.deserializeUser((id,done)=>{
      db.collection('users').findOne({_id : new ObjectID(id)},(err,doc)={
        done(doc);
      });
    });

    app.listen(process.env.PORT || 3000, () => {
      console.log("Listening on port " + process.env.PORT);
    });

  }

});

app.route('/')
  .get((req, res) => {
    res.render(process.cwd() + '/views/pug/index.pug');
  });

