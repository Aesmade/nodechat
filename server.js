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

/* show main page */
app.get('/', function (req, res) {
  res.render('index');
});

/* find rooms created after [param] */
app.get('/getrooms/*?', function(req, res) {
  var query = (req.params[0]) ? {date: {$gt: req.params[0]}} : {};
  Chatroom.find(query).sort( {date: -1} ).then(function(data) {
    var roominfo = _.map(data, function(chat) {
      return {
        name: chat.name,
        id: chat._id,
        date: chat.date.getTime()
      };
    });
    res.json( {rooms: roominfo} );
  }).catch(function(err) {
    res.json( {error: err} );
  });
});

/* create new room */
app.post('/newroom', function(req, res) {
   if (req.body.name) {
     var newchat = new Chatroom({
       name: req.body.name,
       date: Date.now()
     });
     newchat.save();
     res.json( {id: newchat._id} );
     console.log("New: " + newchat);
  } else {
     res.json( {error: 'Empty name'} );
  }
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