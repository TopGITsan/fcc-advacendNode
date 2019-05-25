'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');
const session     = require('express-session');
const passport    = require('passport');
const mongo       = require('mongodb').MongoClient;
const GitHubStrategy = require('passport-github').Strategy;
const passportSocketIo = require('passport.socketio');
const cookieParser = require('cookie-parser');
const sessionStore = require('connect-mongo')(session);




const routes = require('./Routes.js');
const auth = require('./Auth.js');

const app = express();

const http        = require('http').Server(app);
const io = require('socket.io')(http);

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'pug')

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  // store: new sessionStore({
  //   url: 'url',//process.env.DATABASE,
  //   ttl: 24 * 60 * 60 // => 14 days. Default ; set it to 24 hours
  // })
}));

app.use(passport.initialize());
app.use(passport.session());

io.use(passportSocketIo.authorize({
  cookieParser: cookieParser,
  key:          'express.sid',
  secret:       process.env.SESSION_SECRET,
  store:        sessionStore
}));

let currentUsers = 0;
io.on('connection', socket => {
  console.log('A user has connected');
  console.log('user ' + socket.request.user.name + ' connected');
  ++currentUsers;
  console.log('Current logged users: ' + currentUsers);
  io.emit('user', {name: socket.request.user.name, currentUsers, connected: true});
  socket.on('chat message', function(message){
    io.emit('chat message', { name: socket.request.user.name, message });
  });
  socket.on('disconnect', () => { 
    /*anything you want to do on disconnect*/ 
    console.log('a user has disconnected');
    --currentUsers;
    io.emit('user', {name: socket.request.user.name, currentUsers, connected: false});
  });
});

mongo.connect(process.env.DATABASE, (err, client) => {
    const db = client.db('users')
  
    if(err) {
        console.log('Database error: ' + err);
    } else {
        console.log('Successful database connection');
      
        auth(app,db);
        
        passport.use(new GitHubStrategy({
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: process.env.CALLBACKURL
          },
          function(accessToken, refreshToken, profile, cb) {
              console.log("Information from the githhub strategy, user: "+profile.id+ " email: "+ profile.emails.value);
              //Database logic here with callback containing our user object
            db.collection('socialusers').findAndModify(
                {id: profile.id},
                {},
                {$setOnInsert:{
                    id: profile.id,
                    name: profile.displayName || 'John Doe',
                    photo: profile.photos[0].value || '',
                    email: profile.emails || 'No public email',
                    created_on: new Date(),
                    provider: profile.provider || ''
                },$set:{
                    last_login: new Date()
                },$inc:{
                    login_count: 1
                }},
                {upsert:true, new: true},
                (err, doc) => {
                    return cb(null, doc.value);
                }
            );
          }
        ));
      
        
      
        app.route('/auth/github/callback')
          .get(passport.authenticate('github', { failureRedirect: '/' }),(req,res) => {
            
            res.redirect('/profile');
        });      
  
        app.route('/auth/github').get(passport.authenticate('github'));
  
        routes(app, db);
    
        app.listen(process.env.PORT || 3000, () => {
          console.log("Listening on port " + process.env.PORT);
        });  
}});