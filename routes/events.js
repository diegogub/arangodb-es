'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Event = require('../models/event');
const Group = require('../models/group');

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
    var r = Event.storeEvent(event)
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }

  Object.assign(event, meta);
  res.status(201);
  res.send(r)
  //res.send({ id: event._key, error : error, errType : errorType, version : event.version, exist: exist })
}, 'create')
.pathParam('stream', keySchema)
.body(Event, 'The event to create.')
.response(201, Event, 'The created event.')
.error(HTTP_CONFLICT, 'The event already exists.')
.summary('Create a new event into stream')
.description(dd`
  Creates a new event into stream
`);


router.get(':stream/:from/:to', function (req, res) {
  const stream = req.pathParams.stream;
  const from = req.pathParams.from;
  const to = req.pathParams.to;

  let event
  event = Event.range(stream,from,to)
  res.send(event);
}, 'detail')
.pathParam('stream', keySchema)
.pathParam('from', versionSchema)
.pathParam('to', versionSchema)
.response(Event, 'The event.')
.summary('Fetch a event')
.description(dd`
   Range stream
`);

router.get(':stream/:version', function (req, res) {
  const stream = req.pathParams.stream;
  const version = req.pathParams.version;

  let event
  event = Event.getEvent(stream,version)
  res.send(event);
}, 'detail')
.pathParam('stream', keySchema)
.pathParam('version', versionSchema)
.response(Event, 'The event.')
.summary('Fetch a event')
.description(dd`
             get event by version
`);

// create stream group
router.post('group/:name',function (req, res) {
  const name = req.pathParams.name;

  const event = req.body;
  event.stream = stream

  let meta;
  try {
    var r = Event.storeEvent(event)
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }

  Object.assign(event, meta);
  res.status(201);
  res.send(r)
  //res.send({ id: event._key, error : error, errType : errorType, version : event.version, exist: exist })
}, 'create')
.pathParam('name', keySchema)
.body(Group, 'The event group to create.')
.response(201, Group, 'The stream group created .')
.error(HTTP_CONFLICT, 'The stream group already exists.')
.summary('Create a new stream group')
.description(dd`
    Create new stream group.
`);

/*
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
*/

/*
router.get(':stream/merge',function (req, res) {
    var q = db._createStatement({
   "query" : `
    FOR e IN es_events
    FILTER e.stream == @stream
    SORT e.version DESC
    LIMIT 1
    RETURN e.version
   `
  });
  q.bind("stream",p.event.stream);

  var res = q.execute().toArray();
  res.send(events.all());
}, 'list')
.response([Event], 'A list of events.')
.summary('List all events')
.description(dd`
  Retrieves a list of all events.
`);
*/
