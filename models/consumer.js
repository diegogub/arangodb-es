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
    _key : joi.string(),
    name : joi.string().required(),
    postback : joi.string().uri( { scheme : [ 'http', 'https' ] }).required(),
    active : joi.boolean().default(true),
    description : joi.string().default(''),
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
  createStatus(obj){
    var status = {
      _key : obj._key + '_status',
      status : true,
      lastVersion : -1,
      error : false,
      errorCode : 200,
      errorMsg : ''
    }
    db[consumer_col].save(status)
  }
};
