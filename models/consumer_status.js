'use strict';
const _ = require('lodash');
const joi = require('joi');

const event_col = module.context.collectionName('events');
const snapshot_col = module.context.collectionName('snapshot');
const index_col = module.context.collectionName('indexes');

module.exports = {
  schema: {
    _key : joi.string().required(),
    last_version : joi.number().default(-1),
    lastpost : joi.date(),
    error : joi.boolean().default(false),
    errorCode : joi.number(),
    errorMsg : joi.string()
  },
  forClient(obj) {
    obj = _.omit(obj, ['_id', '_rev', '_oldRev']);
    return obj;
  },
  fromClient(obj) {
    return obj;
  }
};
