var clientId = uuid.v4();
var observer = null;
var previousValue = 0;

var context = cubism.context()
  .step(15e3)
  .size(1024)
  .serverDelay(15)
  .clientDelay(5);

function load(feed) {
  var value = 0,
   values = [],
   i = 0,
   last;

  return context.metric(function(start, stop, step, callback) {
       values = [];
       start = +start, stop = +stop;
       last = start;
       while (last <= stop) {
           value = feed.samples.get(last / 1000);
           values.push(typeof value == 'undefined' ? Number.NaN  : value);
           last += step;
       }

       callback(null, values);
    }, feed);
}

function loadCubism(f) {
  f.start = 100; //(new Date().getTime() / 1000) - (60 * 60) | 0;
  /*f.samples.onchanged(function(){});

  var observer = function() {
      console.log("new sample: " + f.samples.lastValue);
  };
  f.samples.onchanged(observer);   */

  d3.select("#cubism-" + f.id).call(function(div) {
    div.datum(load(f));
    div.append("div")
      .attr("class", "horizon")
      .call(context.horizon()
          .height(40)
          .colors(["#08519c","#3182bd","#6baed6","#bdd7e7","#bae4b3","#74c476","#31a354","#006d2c"])
          .title("")
          .extent([0, 100]));
  });
}
Meteor.autorun(function () {
  Meteor.subscribe("feeds");
});

Template.d3_examples.collections = function(){
  return Session.get("collections");
}

Template.d3_examples.events = {
  'click .collection': function(e) {
    console.log("opening" + this.id);
    var c = ili.collectionCache.get(this.id);
    var feeds = c.attributes.get('feeds');

    feeds.forEach(function(fid) {
      var tagsContainer = document.getElementById("tags-" + fid);
      var attributesContainer = document.getElementById("attributes-" + fid);
      var f = ili.feedCache.get(fid);
      f.load(function(){
          var html =  '';
          var options = {
              weekday: "long", year: "numeric", month: "short",
              day: "numeric", hour: "2-digit", minute: "2-digit"
          };
          var lastSample = new Date(f.attributes.get('lastSample')*1000);
          html += '<p>Last sample arrived on <strong>'+ lastSample.toLocaleTimeString("en-us", options) +'</strong></p>';
          attributesContainer.innerHTML = html;

          html ='';
          f.tags.each(function(k,v){
             html += '<span class="label label-success">' + k + ' is ' + v + '</span>';
          });
          tagsContainer.innerHTML = html;

          loadCubism(f);
      });
    });
  } ,

  'click .feed': function(e) {
    console.log("feed" + this);
    e.stopPropagation();
  }
}
var collections = [];

Meteor.startup(function() {
  Session.set("collections", []); 
  
  ili.Api.instance.initialise(clientId);
  Meteor.call('keepalive', clientId);
  ili.collectionCache.query("*", function(result) { 

    result.each(function(k,v){
      var c = ili.collectionCache.get(v);
      c.load(function(){
        var feeds = c.attributes.get('feeds');
        c.feedArray = c.attributes.get('feeds');

        c.collectionTags = [];
        c.tags.each(function(k,v){
          c.collectionTags.push({name: k, value: v});
        });

        collections.push(c);
        Session.set("collections", collections); 
      });
    });
  });
});

Meteor.setInterval(function () {
  console.log("keepalive " + clientId);
  Meteor.call('keepalive', clientId);
}, 20000);

function updateSample(value) {
  if (value) {
    console.log("got new value: '" + value + "', previousValue: '" + previousValue + "'");
    d3.select(".samplev")
      .text(previousValue)
      .transition()
      .duration(1000)
      .ease('linear')
      .tween("text", function() {
        var i = d3.interpolate(this.textContent, value);
        return function(t) {
          this.textContent = Number(i(t)).toFixed(4);
        };
      });
    previousValue = value;
  }
}
var sampleSub = null;
var currentFeed = null;

/*Template.ili_example.events = {
  'click #subscribe' : function () {
    if (currentFeed) {
      currentFeed.feed.samples.removeChangedObserver(currentFeed.observer);
    }
    var guid = document.getElementById("guid").value;
    var feed = ili.feedCache.get(guid);
    feed.loadTags(function(){
      var tags = [];
      feed.tags.each(function(k,v){
        tags.push({name:k, value:v});
      });
      Session.set("tags", tags);
      console.log("Feed loaded: " + tags);
    });

    var observer = function(inserted, removed) {
      updateSample(feed.samples.lastValue);
    }

    currentFeed = { feed: feed, observer: observer };

    feed.samples.onchanged(observer);
  }
}*/
