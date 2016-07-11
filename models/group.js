'use strict';
const _ = require('lodash');
const joi = require('joi');

module.exports = {
  schema: {
    description : joi.string(),
    eventTypes: joi.array().items(joi.string()),
    postback : joi.array().items(joi.object( { name : joi.string(), url : joi.string().uri( { scheme : [ 'http', 'https' ] }) } )).unique()
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
};
