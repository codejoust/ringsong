var express = require('express'),
    models =  require('./models'),
    DocObjectId = require('mongoose').Types.ObjectId,
    http    = require('http');

var app = express.createServer();

app.configure(function(){
  app.use(express.cookieParser());
 // app.use(express.session({ secret: 'failsauce25' }));
  app.use(express.static(__dirname + '/public'));
  app.use(express.bodyParser());
});

app.get('/', function(req, res){
  res.render('main.jade');
});

app.get('/msg/:id', function(req, res){
  console.log(new DocObjectId(req.params.id));
  models.CallList.findById(new DocObjectId(req.params.id))
    .populate('song').run(
    function(err, doc){
      if (err || !doc){ res.send('not found!'); return false; }
      res.render('call.jade', {locals: {calls: doc}});
    });
});

app.post('/lookup-phone', function(req, res){
  if (!req.body.number){
    res.send('number required!');
  } else {
    res.redirect('/snum/' + req.body.number.replace(/[^0-9]/g,''));
  }
});

app.get('/snum/:num', function(req, res){
  models.CallAuthor.findOne({phone: req.params.num}, function(err, author){
    if (err || !author){
      res.send('not found!');
      return false;
    }
    models.CallList.find({author: author._id}).populate('song').run(function(err, callist){
      if (err) throw err;
      res.render('author.jade', {locals: {calllist: callist, author: author}});
    });
  });
});

app.post('/new_msg', function(req, res){
  
  callsess = new models.CallList();
  
  var throw_err =  function(text){
    res.send('Err: ' + text);
    return false;
  }, set_song = function(song_id){

    callsess.song = song_id;

    var ip = ('x-forwarded-for' in req.headers) ? req.headers['x-forwarded-for'] : req.connection.remoteAddress;
    models.CallAuthor.findOne({phone: callsess.get('from_phone')}, function(err, user){
      if (err) { throw_err(err); return false; }
      if (!user){
        var user = new models.CallAuthor({phone: callsess.get('from_phone')});
      }
      user.last_req = Date.new;
      user.last_ip = ip;
      user.save(function(err, doc){
        if (err){ throw_err(err); return false; }
        if (doc){
          callsess.author = doc._id;
        }
        fin_req();
      });
    });
  }, set_author = function(author_id){
    callsess.author = author_id; 
  }, fin_req = function(){
    callsess.save(function(err, doc){
      if (err || !doc){ throw_err(err); return false; }
      res.redirect('/msg/' + doc._id)
    });
  };
  
  if ('your_number' in req.body)  callsess.your_number  = req.body.your_number;
  if ('their_number' in req.body) callsess.their_number = req.body.their_number;  
  if ('song-asin' in req.body && 'song-name' in req.body && 'song-artist' in req.body){
    models.Song.findOne({asin: req.body['song-asin']}, function(err, song){
      if (err) throw_err(err);
      if (!song){
        var song = new models.Song({asin: req.body['song-asin'], title: req.body['song-name'], artist: req.body['song-artist']})
        song.save(function(err, song){
          if (err) throw_err(err);
          set_song(song._id);
        });
      } else {
        set_song(song._id);
      }
    });
  }

});

app.listen(5434);
