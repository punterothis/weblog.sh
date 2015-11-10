'use strict';

var express     = require('express');
var exphbs      = require('express-handlebars');
var bodyParser  = require('body-parser');
var mongoose    = require('mongoose');
var constants   = require('./constants');
var schemas     = require('./lib/schemas');
var cache       = require('./lib/cache');
var ratelimit   = require('./lib/ratelimit');

var hbs = exphbs.create({
  defaultLayout: 'user',
  extname: '.hbs',
  helpers: {
    shortDate: function (date) {
      return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    },
    shorterDate: function (date) {
      return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) +' '+ date.toLocaleDateString('en-GB', { year: 'numeric' });
    }
  }
});

var User    = mongoose.model('User', schemas.user);
var Article = mongoose.model('Article', schemas.article);

var app = express();

app.use(function(req, res, next){
  if (req.hostname !== constants.hostname) {
    res.header('Content-Type', 'text/plain');
    res.status(404).send('(ﾉ´ヮ´)ﾉ*:･ﾟ✧');
    res.end();
  } else {
    next();
  }
});

app.use(bodyParser.text());

app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');
if (process.env.NODE_ENV !== 'development') { app.enable('view cache'); }

app.use('/endpoint', ratelimit);

app.use('/endpoint', function (req, res, next) {
  if(req.headers['x-token'] !== undefined) {
    User.findOne({token: req.headers['x-token']}, function(err, user){
      if (err) { console.log('Error: ', err); }

      if (user) {
        req.user = user;
        next();
      } else {
        res.status(401).send('BAD^^^Invalid token, please login again.');
      }
    });
  } else {
    next();
  }
});

app.use(['/~:username', '/~:username*'], function (req, res, next) {

  User.findOne({username: req.params.username}, function(err, user){
    if (err) { console.log('Error: ', err); }

    if (user) {
      req.user = user;
      next();
    } else {
      res.status(404);
      res.render('error', {message: 'NOT FOUND', layout: false});
      // next();
    }
  });

});

app.use(function(err, req, res, next) {
  console.log(err.stack);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500);
  res.render('error', {message: 'ERROR', layout: false});
});

app.post('/endpoint', function (req, res, next) {

  var semver = require('semver');
  var fs = require('fs');

  var clientVersion = req.headers['user-agent'].replace('/', 'X'); //sanitize ver
  var clientSemver = clientVersion.match(/.*-(.*)$/)[1];

  var endpoint = null;

  fs.readdir('./endpoint', function(err, items) {
    for (var i=0; i<items.length; i++) {
      var endpointSemver = items[i].match(/(.*)\.js$/)[1];

      if (semver.satisfies(clientSemver, endpointSemver)) {
        console.log(clientSemver, endpointSemver);
        endpoint = require('./endpoint/'+endpointSemver+'.js');
        break;
      }
    }

    if (endpoint === null) {
      res.send('BAD^^^Your version is not supported.');
      next();
    } else {

      if (endpoint[req.headers['x-action']] === undefined) {
        res.send('BAD^^^Command not found.');
        next();
      }

      endpoint[req.headers['x-action']](req, res, next, {
        callback: function(req, res, next){
          next();
        }
      });

    }


  }); // readdir

});


app.get('/~:username/*-:id', cache.route(), function (req, res) {

  Article
  .findOne({author: req.user._id, _id: req.params.id, status: 'published'})
  .exec(function(err, article){
    if (err) { console.log('Error: ', err); }

    if (article) {
      res.render('post', {user: req.user, article: article, isPost: true, constants: constants});
    } else {
      res.status(404);
      res.render('error', {message: 'NOT FOUND', layout: false, constants: constants});
    }


  });

});


app.get('/~:username/feed', cache.route(), function (req, res) {

  var Feed = require('feed');
  var feed = new Feed({
    title:          '~'+req.user.username,
    link:           constants.protocol+'://'+constants.host+'/~'+req.user.username,
    copyright:      'All Rights Reserved '+(new Date().getFullYear())+', '+req.user.username,

    author: {
      title:          '~'+req.user.username,
      link:           constants.protocol+'://'+constants.host+'/~'+req.user.username
    }
  });

  Article
  .find({author: req.user._id, status: 'published'})
  .sort({published_ts: -1})
  .limit(20)
  .exec(function(err, posts){
    if (err) { console.log('Error: ', err); }

    for (var key in posts) {
      feed.item({
        title: posts[key].title,
        link: constants.protocol+'://'+constants.host+'/~'+req.user.username+'/'+posts[key].slug+'-'+posts[key]._id,
        description: posts[key].content,
        author: [{
          title: '~'+req.user.username,
          link: constants.protocol+'://'+constants.host+'/~'+req.user.username
        }],
        date: posts[key].published_ts,
      });

    }

    res.set('Content-type', 'text/xml');
    res.send(feed.render('atom-1.0'));

  });

});

app.get('/~:username', cache.route(), function (req, res) {

  Article
  .find({author: req.user._id, status: 'published'})
  .sort({published_ts: -1})
  .limit(100)
  .exec(function(err, articles){
    if (err) { console.log('Error: ', err); }

    res.render('index', {user: req.user, articles: articles, isIndex: true, constants: constants});

  });

});

app.get(constants.downloadpath, function (req, res) {

  var fs = require('fs');
  fs.readFile('client/'+constants.latest+'.sh', 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
    data = data.replace('{{ENDPOINT}}', constants.endpointurl);
    data = data.replace('{{BRAND}}', constants.brand);
    res.setHeader('Content-disposition', 'attachment; filename='+constants.latest+'.sh');
    res.send(data);
  });

});

app.get('/', cache.route({ expire: 300  }), function (req, res) {

  res.render('home', {
    layout: 'main',
    latest: constants.latest,
    constants: constants});

});

app.get('/terms', cache.route(), function (req, res) {

  res.render('terms', {
    layout: 'main',
    latest: constants.latest,
    constants: constants});

});

app.get('/privacy', cache.route(), function (req, res) {

  res.render('privacy', {
    layout: 'main',
    latest: constants.latest,
    constants: constants});

});

app.get('/about', cache.route(), function (req, res) {

  res.render('about', {
    layout: 'main',
    latest: constants.latest,
    constants: constants});

});

app.get('*', function(req, res){
  res.status(404);
  res.render('error', {message: 'NOT FOUND', layout: false});
});

var server = app.listen(constants.port, function () {
  var host = server.address().address;
  var port = server.address().port;
});
