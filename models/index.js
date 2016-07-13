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
  },
  forClient(obj) {
    // Implement outgoing transformations here
    obj = _.omit(obj, ['_id', '_rev', '_oldRev']);
    return obj;
  },
  fromClient(obj) {
    // Implement incoming transformations here
    return obj;
  }
}
