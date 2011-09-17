if (typeof(soundManager) != 'undefined'){
  soundManager.url = 'libs/'; 
}

var app = {models: {}, views: {}};

app.models.Song = Backbone.Model.extend({
  className: 'song',
  get_preview_url: function(){
    var asin = this.attributes.ASIN;
    return 'http://www.amazon.com/gp/dmusic/get_sample_url.html?ASIN=' + asin;
  },
  desc: function(){
    var tpl = this.for_template();
    return tpl.sname + ' - ' + tpl.artist;
  },
  for_template: function(){
    var attr = this.toJSON();
    if (attr.Subtitle) attr.Subtitle = attr.Subtitle.replace(/ \(.*\)$/, '')
    return this.tplv = ({
      asin: attr.ASIN,
      img: attr.ImageUrl,
      sname: attr.Title,
      artist: attr.Subtitle
    });
  }
});

app.models.SongList = Backbone.Collection.extend({
  model: app.models.Song,
  fetching: false,
  initialize: function(){
    _.bindAll(this, 'fetch', 'got_data');
  },
  amzn_url: function(keyword){
    return 'http://ws.amazon.com/widgets/q?Operation=GetResults&Keywords='+escape(keyword)+'&SearchIndex=MP3Downloads&multipageStart=0&InstanceId=0&multipageCount=20&TemplateId=8002&ServiceVersion=20070822&MarketPlace=US';
  },
  fetch: function(iterm){
    this.trigger('fetch');
    if (iterm) this.term = iterm;
    this.fetching = true;
    if (!this.term) return false;
    $.getScript(this.amzn_url(this.term))
    window.search_callback = this.got_data;
  },
  got_data: function(data){
    this.fetching = false;
    if ('results' in data){
      this.reset(data.results);
    }
  }
});

$(function(){

  app.views.Song = Backbone.View.extend({
    template: _.template($('#song-tpl').html()),
    initialize: function(){
      _.bindAll(this, 'stop_preview');
      this.model.collection.bind('fetch', this.stop_preview);
      this.playing = false;
    },
    events: {
      'click .preview': 'play_preview',
      'click .use':     'select_song'
    },
    render: function(){
      $(this.el).html(this.template(this.model.for_template()));
      this.preview_link = this.$('.preview')
      return this;
    },
    stop_preview: function(){
      if (this.playing) {
        this.song.stop();
        this.playing = false;
      }
    },
    select_song: function(){
      this.model.collection.trigger('select', this.model);
    },
    play_preview: function(e){
      if (!this.playing){
        if (!this.song){
          this.song = soundManager.createSound({
            id: this.model.attributes.ASIN,
            url: this.model.get_preview_url(),
            volume: 75
          });
        }
        this.preview_link.html('pause');
        this.song.play();
        this.playing = true;
      } else {
        this.preview_link.html('resume')
        this.song.pause();
        this.playing = false;
      }
      if (e) e.preventDefault();
    }
  });

  app.views.SongList = Backbone.View.extend({
    initialize: function(){
      _.bindAll(this, 'render');
      this.collection.bind('reset', this.render);
    },
    search: function(term){
      this.collection.fetch(term);
    },
    render: function(){
      var el = $(this.el);
      el.html('<ul class="songlist"></ul>');
      var ul = el.find('ul');
      var models = this.collection.models;
      for (var i = 0; i < models.length; i++){
        models[i].view = new app.views.Song({model: models[i]});
        models[i].view.render()
        ul.append(models[i].view.el);
      }
      return this;
    }
  });

  app.views.SongSearchbox = Backbone.View.extend({
    id: 'song-input',
    events: {
      'keypress #text-song': "checkEnter",
      'click .search': 'runSearch'
    },
    use_song: function(song){
      this.songlist.collection.reset();
      this.$('#song-res').html(song.desc());
      this.$('#song-artist').val(song.tplv.artist);
      this.$('#song-name').val(song.tplv.sname);
      $('#submit-new').removeAttr('disabled');
      $(this.el).addClass('valid');
      $('#text-song').val(song.get('Title'));
      $('#song-asin').val(song.get('ASIN'));
    },
    initialize: function(){
      _.bindAll(this, 'use_song');
      this.songlist = new app.views.SongList({
        collection: new app.models.SongList(),
        el: this.$('.songl')
      });
      this.songlist.collection.bind('select', this.use_song);
    },
    checkEnter: function(e){
      if (e.keyCode == 13){
        this.runSearch();
        e.preventDefault();
      }
    },
    runSearch: function(){
      this.$('#song-res').html('pick a song');
      $(this.el).removeClass('valid');
      $('#submit-new').attr('disabled', true);
      this.songlist.search(this.$('#text-song').val());
    }
  });

  $('.number input').mask('(999) 999-9999', 
    {completed: function(){ $(this).addClass('done').parents('.number').addClass('valid'); }});

  $('form.validate').submit(function(e){
    var el = $(this);
    if (el.find('qval:not(.valid)')){
      alert('Please fill in all the form fields!');
      e.preventDefault();
    }
  });

  if ($('#song-input').length){
    window.sbox = new app.views.SongSearchbox({el: $('#song-input')});
  }

});
