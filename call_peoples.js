var tropo_sess = require('./tropo-session')
 ,  http       = require('http')
 ,  models     = require('./models')
 ,  conf       = require('./config');


models.CallList.where(
  { $lt: { at_time: new Date() + 60*60*1000 + 2 }, 
    $gt: { at_time: new Date() }})
  .where('status.done', false)
  .where('status.from_accept', true)
  .populate('song').run(function(err, docs){

    console.log(docs);

    for (var i=0; i < docs.length; i++){
      var call_req = docs[i];

      console.log('starting req!');

      sess = new tropo_sess.TropoSession();
      sess.makeApiCall(conf.token, {
        to_number: call_req.to_phone,
        songurl: 'http://www.amazon.com/gp/dmusic/get_sample_url.html?ASIN=' + call_req.song.asin,
        asin: call_req.song.asin,
        songinfo: call_req.song.title + ' - ' + call_req.song.artist
      });
      sess.on('responseBody', function(body){ 
        console.log(body);
        models.CallList.update({_id: call_req._id}, {$set: {'status.done': true}})
      });

    }
    sys.exit();
  });

  
