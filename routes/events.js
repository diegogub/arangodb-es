'use strict';
const dd = require('dedent');
const request = require('@arangodb/request');
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

const queues = require('@arangodb/foxx/queues');

const router = createRouter();
module.exports = router;

const postback = module.context.configuration.postback




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

  Object.assign(event, r);

  // Post into NSQ queue
  if (postback != null && postback != ""){
   try {
   request.post(postback, { body : event, json: true})
   }catch(err){
   }
  }

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

router.get('all/:from/:to', function (req, res) {
  const from = req.pathParams.from;
  const to = req.pathParams.to;

  let event
  event = Event.rangeAll(from,to)
  res.send(event);
}, 'detail')
.pathParam('from', versionSchema)
.pathParam('to', versionSchema)
.response(Event, 'The event.')
.summary('Fetch a event')
.description(dd`
   Range main stream
`);

router.get('all/version', function (req, res) {
  const from = req.pathParams.from;
  const to = req.pathParams.to;

  let v
  v = Event.allVersion()
  res.send({ correlation : v });
}, 'detail')
.summary('main correlation version')
.description(dd`
             Return main correlation version
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
             Get event by version
`);
