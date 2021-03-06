'use strict';
const _ = require('lodash');
const joi = require('joi');
const db = require('@arangodb').db;
const event_col = module.context.collectionName('events');
const snapshot_col = module.context.collectionName('snapshots');

module.exports = {
  schema: {
    _key: joi.string(),
    stream : joi.string().required(),
    version : joi.number().required(),
    data : joi.object().default({}),
    timestamp : joi.date().default(new Date())
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
  getLast(stream) {
        var q = db._createStatement({
         "query" : `
          FOR s IN @@col
          FILTER s.stream == @stream
          SORT s.timestamp DESC
          LIMIT 1
          RETURN s
         `
       });
       console.log(snapshot_col)
       q.bind("@col",snapshot_col);
       q.bind("stream",stream);
       var res = q.execute().toArray();
       if (res.length == 0 ){
         return {}
       }else{
         return res[0]
       }
  },
  getVersion(stream,version) {
        var q = db._createStatement({
         "query" : `
          FOR s IN @@col
          FILTER s.stream == @stream && s.version == @version
          SORT e.timestamp DESC
          LIMIT 1
          RETURN s
         `
       });
       q.bind("@col",p.col.events);
       q.bind("stream",stream);
       q.bind("version",version);
       var res = q.execute().toArray();
       if (res.length == 0 ){
         return {}
       }else{
         return res[0]
       }
  }
};
