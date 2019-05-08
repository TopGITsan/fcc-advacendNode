'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const mongodb     = require('mongodb');
const session     = require('express-session');
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



app.route('/')
  .get((req, res) => {
    res.render(process.cwd() + '/views/pug/index.pug');
  });

app.listen(process.env.PORT || 3000, () => {
  console.log("Listening on port " + process.env.PORT);
});
