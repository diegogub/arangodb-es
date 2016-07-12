'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Consumer = require('../models/consumer');
const ConsumerUpdate = require('../models/consumer_update');
const ConsumerStatus = require('../models/consumer_status');

const consumers = module.context.collection('consumers');
const keySchema = joi.string().required()
const versionSchema = joi.number().required()

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;

router.post(function (req, res) {
  const consumer = req.body;
  let meta;
  try {
    meta = consumers.save(consumer)
    Consumer.createStatus(consumer)
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }

  Object.assign(consumer, meta);
  res.status(201);
  res.send(consumer)
}, 'create')
.body(Consumer, 'The consumer to create.')
.response(201, Consumer, 'The created consumer.')
.error(HTTP_CONFLICT, 'The consumer already exists.')
.summary('creates new consumer')
.description(dd`
  Creates a new consumer
`);

router.post(':key',function (req, res) {
  const key = req.pathParams.key;
  const consumer = req.body;
  let meta;
  try {
    meta = consumers.update(key,consumer)
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }

  Object.assign(consumer, meta);
  res.status(201);
  res.send(consumer)
}, 'create')
.pathParam('key', keySchema)
.body(ConsumerUpdate, 'The consumer to update.')
.response(201, ConsumerUpdate, 'The updated consumer.')
.error(HTTP_CONFLICT, 'The consumer do not exist.')
.summary('updates consumer')
.description(dd`
             Updates consumer data.
`);

router.get(':key',function (req, res) {
  const key = req.pathParams.key;
  let consumer;
  try {
    consumer = consumers.document(key)
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }

  res.status(200);
  res.send(consumer)
}, 'create')
.pathParam('key', keySchema)
.response(201, Consumer, 'Gets consumer data')
.error(HTTP_CONFLICT, 'The consumer do not exist.')
.summary('gets consumer data')
.description(dd`
             Gets consumer data.
`);

// get consumer status
router.get(':key/status',function (req, res) {
  const key = req.pathParams.key;
  let consumer;
  try {
    consumer = consumers.document(key + '_status')
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }

  res.status(200);
  res.send(consumer)
}, 'create')
.pathParam('key', keySchema)
.response(201, Consumer, 'Gets consumer status')
.error(HTTP_CONFLICT, 'The consumer do not exist.')
.summary('gets consumer data')
.description(dd`
             Gets consumer status.
`);

// update consumer status
router.post('status',function (req, res) {
  const update = req.body;
  let consumer;
  try {
    consumer = ConsumerStatus.updateStatus(update)
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }

  res.status(200);
  res.send(consumer)
}, 'create')
.body(ConsumerStatus,'Consumer new status')
.response(201, Consumer, 'update consumer status')
.error(HTTP_CONFLICT, 'The consumer do not exist.')
.summary('gets consumer data')
.description(dd`
             Updates consumer status.
`);
