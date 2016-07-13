'use strict';
const _ = require('lodash');
const joi = require('joi');
const db = require('@arangodb').db;

const event_col = module.context.collectionName('events');
const snapshot_col = module.context.collectionName('snapshot');
const index_col = module.context.collectionName('indexes');
const consumer_col = module.context.collectionName('consumers');

module.exports = {
  schema: {
    _key : joi.string().required(),
    lastVersion : joi.number().default(-1),
    lastPost  : joi.date(),
    error     : joi.boolean().default(false),
    errorCode : joi.number(),
    errorMsg  : joi.string()
  },
  forClient(obj) {
    obj = _.omit(obj, ['_id', '_rev', '_oldRev']);
    return obj;
  },
  fromClient(obj) {
    return obj;
  },
  updateStatus(newStatus){
    var r = db._executeTransaction({
      collections: {
        write: [ consumer_col ]
      },
      action : function(p){
        var db = require("internal").db;

        var status = db[p.col.consumers].document(p.update._key + "_status")
        console.log(status)



        return 0
      },

      params : { update : newStatus, col : { consumers : consumer_col } }
    })
  }
};
