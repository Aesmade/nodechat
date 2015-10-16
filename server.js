var _ = require('underscore');
var bodyParser = require('body-parser');
var express = require('express');
var mongoose = require('mongoose');

var app = express();

mongoose.connect('mongodb://localhost/badchat');
var db = mongoose.connection;

var Chatroom;

var getRoom = function(roomid) {
  return new Promise(function(fulfill, reject) {
    Chatroom.findById(roomid).exec(function(err, data) {
    if (err)
      reject(err);
    else if (!data)
      reject("Room not found");
    else
      fulfill(data);
    });
  });
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

app.use(express.static('public'));

app.get('/', function (req, res) {
  res.render('index');
});

app.get('/getrooms', function(req, res) {
  Chatroom.find({}).sort( {date: -1} ).then(function(data) {
    var roominfo = _.map(data, function(chat) {
      return {
        name: chat.name,
        id: chat._id
      };
    });
    res.json( {rooms: roominfo} );
  }).catch(function(err) {
    res.json( {error: err} );
  });
});

app.post('/newroom', function(req, res) {
   if (req.body.name) {
     var newchat = new Chatroom({
       name: req.body.name,
       date: new Date()
     });
     newchat.save();
     res.json( {id: newchat._id} );
  } else {
     res.json( {error: 'Empty name'} );
  }
});

app.get('/room/:room', function(req, res) {
  res.render('room', {id: req.params.room} );
});

app.get('/room/:room/get', function(req, res) {
  getRoom(req.params.room).then(function (data) {
    res.json(data.msg);
  }).catch(function (err) {
    res.json({error: err.toString()});
  });
});

app.post('/room/:room/send', function(req, res) {
  var body = req.body;
  if (body.user && body.text) {
    getRoom(req.params.room).then(function (data) {
      data.msg += {
        user: body.user,
        text: body.text,
        date: new Date()
      };
    }).catch(function (err) {
      res.json({error: err.toString()});
    });
  } else
    res.end();
});

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
    console.log("MongoDB connection opened");
    Chatroom = mongoose.model('chatroom', mongoose.Schema({
      name: String,
      date: Date,
      msg: [{
        user: String,
        text: String,
        date: Date
      }]
    }));
    
    var server = app.listen(process.env.PORT, process.env.IP, 100, function() {
      var host = server.address().address;
      var port = server.address().port;

      console.log('Listening at http://%s:%s', host, port);
  });
});