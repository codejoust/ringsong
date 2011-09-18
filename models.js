var mongoose   = require('mongoose'),
    Schema  = mongoose.Schema;

mongoose.connect('mongodb://localhost/annoy2_db')

var models = {};
module.exports = models;

var SongS = new Schema({
  asin: String,
  artist: String,
  title: String,
  created: {type: Date, default: Date.now },
  preview_url: String,
  used: {type: Number, default: 0}
});
SongS.virtual('desc').get(function(){
  return this.get('title') + ' - ' + this.get('artist');
});
models.Song = mongoose.model('Song', SongS);

var CallAuthorS = new Schema({
  phone: Number,
  date: {type: Date, default: Date.now },
  last_ip: String,
  last_req: {type: Date, default: Date.now },
  karma: {type: Number, default: 1},
  validated: {type: Boolean, default: false}
});
models.CallAuthor = mongoose.model('CallAuthor', CallAuthorS);

var CallListS = new Schema({
  author: {type: Schema.ObjectId, required: true, ref: 'CallAuthor'},
  to_phone: {type: Number, required: true},
  cid: String,
  from_phone: {type: Number, required: true},
  status: {
    to_block: Boolean,
    to_cancel: Boolean,
    from_accept: Boolean,
    done: {type: Boolean, default: false}
  },
  call_delay: {type: Number, default: 2},
  call_at: Date,
  date: {type: Date, default: Date.now },
  ip: String,
  song: {type: Schema.ObjectId, required: true, ref: 'Song'}
});

CallListS.path('call_delay').set(function(num){
  this.set('call_at', (new Date) + 1000*60*60 * num);
  this.set('cll_delay', num);
});

CallListS.virtual('their_number').set(function(val){
  if (val.replace(/[^0-9]/g, '').length < 9) throw new Error('Invalid Phone');
	this.set('to_phone', parseInt(val.replace(/[^0-9]/g, '')));
});

CallListS.virtual('your_number').set(function(val){
  if (val.replace(/[^0-9]/g, '').length == 9) throw new Error('Invalid Phone');
	this.set('from_phone', parseInt(val.replace(/[^0-9]/g, '')));
});

models.CallList = mongoose.model('CallList', CallListS);
