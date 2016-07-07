'use strict';
const _ = require('lodash');
const joi = require('joi');
const db = require('@arangodb').db;
const events = module.context.collection('events');

const event_col = module.context.collectionName('events');
const snapshot_col = module.context.collectionName('snapshot');
const index_col = module.context.collectionName('indexes');

module.exports = {
  schema: {
    // Describe the attributes with joi here
    _key: joi.string(),

    // userid
    user : joi.string(),

    // event group, for validation
    group : joi.string(),

    // event type
    type : joi.string().required(),

    // set version if needed, if -1
    version : joi.number().default(-1),

    // must create stream
    create : joi.boolean().default(false),

    // event data
    data : joi.object().default({}),

    // uniqueness check
    checks : joi.object().default({}),

    // event timestamp
    correlation : joi.number().default(-1)
  },
  forClient(obj) {
    // Implement outgoing transformations here
    obj = _.omit(obj, ['_id', '_rev', '_oldRev']);
    return obj;
  },
  fromClient(obj) {
    // Implement incoming transformations here
    return obj;
  },
  storeEvent(event) {
    var r = db._executeTransaction({
      collections: {
        write: [ event_col, index_col ]
      },
      action: function (p) {
        var db = require("internal").db;
        var tres = { error : false }
        var q = db._createStatement({
         "query" : `
          FOR e IN @@col
          FILTER e.stream == @stream
          SORT e.version DESC
          LIMIT 1
          RETURN e.version
         `
       });
       q.bind("@col",p.col.events);
       q.bind("stream",p.event.stream);

       var res = q.execute().toArray();
       var curVersion = -1

       if (res.length == 0 ){
         curVersion = -1;
       }else{
         //Check if stream is created
         if (event.create == true) {
           tres.error = true;
           tres.errType = "Not creating stream";
         }
         curVersion = res[0];
       }

       var cq = db._createStatement({
         "query" : `
          FOR e IN @@col
          SORT e.correlation DESC
          LIMIT 1
          RETURN e.correlation
         `
       });
       cq.bind("@col",p.col.events);
       var cres = cq.execute().toArray();
       console.log(cres)
       if (cres.length == 0 ){
         event.correlation = 0;
       }else{
         event.correlation = cres[0] + 1;
       }

       // check version lock
       if (event.version >= 0) {
         if (curVersion != event.version){
           tres.error = true
           tres.errType = "Invalid version lock"
         }
       }

       // check ID
       if (tres.error == false && event._key != null) {
        if (db[p.col.events].exists(event._key)){
          tres.exist = true
        }
       }

       if ( !tres.exist && !tres.error) {
         event.version = curVersion + 1;
         var meta = db[p.col.events].save(event);
         tres._key = meta._key
         tres.correlation = event.correlation
         tres.version = event.version
       }

       return tres;
      },

      params : { event : event , col : { events : event_col }}

    });

    return r
  },
  exist(id) {
    if (id != "" && id != null) {
     return events.exists(id)
    }

    return false
  },
  range(stream,from,to) {
    var q = db._createStatement({
     "query" : `
      FOR e IN @@col
      FILTER e.stream == @stream
      FILTER e.version >= @from && e.version <= @to
      SORT e.version ASC
      RETURN e
     `
   });
   q.bind("@col",event_col);
   q.bind("stream",stream);
   q.bind("from",from);
   q.bind("to",to);
   return q.execute().toArray();
  },
  rangeAll(from,to) {
    var q = db._createStatement({
     "query" : `
      FOR e IN @@col
      FILTER e.correlation >= @from && e.correlation <= @to
      SORT e.correlation ASC
      RETURN e
     `
   });
   q.bind("@col",event_col);
   q.bind("from",from);
   q.bind("to",to);
   return q.execute().toArray();
  },
  allVersion() {
    var q = db._createStatement({
     "query" : `
      FOR e IN @@col
      SORT e.correlation DESC
      LIMIT 1
      RETURN e.correlation
     `
   });
   q.bind("@col",event_col);
   var res = q.execute().toArray();

   if (res.length == 0 ) {
     return -1
   }else {
    return res[0]
   }
  },
  streamExist(stream,version){
    var q = db._createStatement({
     "query" : `
      FOR e IN @@col
      FILTER e.stream == @stream && e.version == @version
      LIMIT 1
      RETURN e.stream
     `
   });
   q.bind("@col",event_col);
   q.bind("stream",stream);
   q.bind("version",version);
   var res = q.execute().toArray();
   if (res.length == 0) {
     return false
   }else{
    return true
   }
  },
  getEvent(stream,version) {
    var q = db._createStatement({
     "query" : `
      FOR e IN @@col
      FILTER e.stream == @stream && e.version == @version
      RETURN e
     `
   });
   q.bind("@col",event_col);
   q.bind("stream",stream);
   q.bind("version",version);

   var res = q.execute().toArray();
   if (res.length == 0) {
     return {}
   }else{
    return res[0]
   }
  }
};
