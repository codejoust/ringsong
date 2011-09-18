var tropo_sess = require('./tropo-session')
 ,  http       = require('http')
 ,  models     = require('./models')
 ,  conf       = require('./config');

models.CallList.where(
  { $lt: { at_time: new Date() + 60*60*1000 + 2 }, 
    $gt: { at_time: new Date() }})
  .where('status.done', false)
  .populate('song').run(function(err, docs){
    console.log(docs);
    var resp = 0;
   if (docs.length ==0){process.exit()}
    for (var i=0; i < docs.length; i++){
      (function(call_req){
        var call_req = docs[i];
        if (!'cid' in call_req || call_req.cid == undefined){ call_req.cid = call_req.from_phone }
        if (call_req.from_phone == call_req.to_phone){ call_req.cid = '4842121492'; }
        sess = new tropo_sess.TropoSession();
        sess.makeApiCall(conf.token, {
          to_number: call_req.to_phone,
          asin: call_req.song.asin,
          songinfo: call_req.song.title + ' - ' + call_req.song.artist,
          cid: call_req.cid
        });
        sess.on('responseBody', function(body){ 
          console.log(body);
  	  call_req.status.done = true;
  	  call_req.song = call_req.song._id;
          call_req.date = new Date();
	  call_req.save(function(err, doc){
	    if (err){ console.log(err); }
   	    if (++resp >= docs.length){ console.log('done!'); process.exit(); }
          })
       });
     })(docs[i]);
    }
  });
