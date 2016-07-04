'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Event = require('../models/event');

const events = module.context.collection('events');
const keySchema = joi.string().required()
const versionSchema = joi.number().required()
.description('The key of the event');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.get(function (req, res) {
  res.send(events.all());
}, 'list')
.response([Event], 'A list of events.')
.summary('List all events')
.description(dd`
  Retrieves a list of all events.
`);


router.post(':stream',function (req, res) {
  const stream = req.pathParams.stream;
  if (stream == "") {
    res.status(404);
    return
  }

  const event = req.body;
  event.stream = stream

  let meta;
  try {
    meta = events.save(event);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(event, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: event._key})
  ));
  res.send(event);
}, 'create')
.pathParam('stream', keySchema)
.body(Event, 'The event to create.')
.response(201, Event, 'The created event.')
.error(HTTP_CONFLICT, 'The event already exists.')
.summary('Create a new event into stream')
.description(dd`
  Creates a new event into stream
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let event
  try {
    event = events.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(event);
}, 'detail')
.pathParam('key', keySchema)
.response(Event, 'The event.')
.summary('Fetch a event')
.description(dd`
  Retrieves a event by its key.
`);

router.delete(':stream/:snapshot', function (req, res) {
  const stream = req.pathParams.stream;
  const snapshot = req.pathParams.snapshot;
  try {
    events.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('stream', keySchema)
.pathParam('snapshot', keySchema)
.response(null)
.summary('Remove a event')
.description(dd`
  Truncate stream until snapshot
`);
