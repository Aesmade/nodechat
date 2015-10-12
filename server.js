var _ = require('underscore');

var express = require('express');
var app = express();

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/badchat');
var db = mongoose.connection;

var Chatroom;

app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

app.get('/', function (req, res) {
  res.render('index');
});

app.get('/getrooms', function(req, res) {
  Chatroom.find({}, function(err, data) {
    if (err == null) {
      var roominfo = _.map(data, function(chat) {
        return {name: chat.name, id: chat._id};
      });
      res.json( {rooms: roominfo} );
    } else {
      res.json( {error: err} );
    }
  });
});

app.post('/makeroom', function(req, res) {
  req.on('data', function (data) {
    var chatname = JSON.parse(data);
    if (chatname !== null) {
      var newchat = new Chatroom({name: req.body});
      newchat.save();
      res.json({'id': newchat._id});
    } else {
      res.json({error: 'Empty name'});
    }
  })
});

app.get('/:room', function(req, res) {
  res.render('room', {id: req.params.room} );
});

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
    console.log("MongoDB connection opened");
    Chatroom = mongoose.model('chatroom', mongoose.Schema({
      name: String,
      msg: [{user: String, text: String, date: Date}]
    }));
    
    var server = app.listen(process.env.PORT, process.env.IP, 100, function() {
      var host = server.address().address;
      var port = server.address().port;

      console.log('Listening at http://%s:%s', host, port);
  });
});