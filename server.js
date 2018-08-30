'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var dns = require('dns');

var bodyParser = require('body-parser');

var cors = require('cors');

var app = express();

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
process.env.MONGO_URI = 'mongodb://admin:Admin1@ds125472.mlab.com:25472/rlg_fcc';
mongoose.connect(process.env.MONGO_URI);

var Schema = mongoose.Schema;
var urlSchema = new Schema({
  url: {required: true, type: String},
  short: {required: true, type: String}
});
var URL = mongoose.model('URL', urlSchema);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl/new', function(req, res) {
  if (!req.body.url) {
    res.json({error: 'invalid URL'});
    return;
  }
  
  var path = req.body.url.split('/').filter(s => s.length > 0);
  if (path.length < 2) {
    res.json({error: 'invalid URL', split: true});
    return;
  }
  
  dns.lookup(path[1], function(err, address, family) {
    if (err) {
      res.json({error: 'invalid URL'});
      return;
    }
    const short = (Date.now() - new Date(2018, 1, 1)).toString(36);
    var result = {url: path[1], short};
    var url = new URL(result);
    url.save((err, data) => {
      if (err) {
        res.json({error: 'couldn\'t save'});
        return;
      }
      res.json(result);
    });
  });
});

app.get('/:url', function(req, res) {
  console.log(req.params.url);
  URL.findOne({short: req.params.url}, null, function(err, data) {
    if (err) {
      res.json({error: 'couldn\'t find data'});
      return;
    }
    res.redirect('http://' + data.url);
  });
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});