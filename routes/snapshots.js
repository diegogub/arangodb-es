'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Snapshot = require('../models/snapshot');
const Event = require('../models/event');
const db = require('@arangodb').db;

const snapshots = module.context.collection('snapshots');
const keySchema = joi.string().required()
.description('The key of the snapshot');
const versionSchema = joi.number().required()

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;

router.post(function (req, res) {
  const snapshot = req.body;

  // check if stream exist
  if (!Event.streamExist(snapshot.stream,snapshot.version)) {
    res.status(404);
    res.send({ error : true, errType : "event do not exist"});
    return
  }

  let meta;
  try {
    meta = snapshots.save(snapshot);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(snapshot, meta);
  res.status(201);
  res.send(snapshot);
}, 'create')
.body(Snapshot, 'The snapshot to create.')
.response(201, Snapshot, 'The created snapshot.')
.error(HTTP_CONFLICT, 'The snapshot already exists.')
.summary('Create a new snapshot')
.description(dd`
  Creates a new snapshot from the request body and
  returns the saved document.
`);


router.get(':stream/:version', function (req, res) {
  const version = req.pathParams.version;
  const stream = req.pathParams.stream;
  let snapshot
  try {
    snapshot = Snapshot.getVersion(stream,version)
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(snapshot);
}, 'detail')
.pathParam('stream', keySchema)
.pathParam('version', versionSchema)
.response(Snapshot, 'The snapshot.')
.summary('Fetch a snapshot')
.description(dd`
  Retrieves a snapshot by its key.
`);

router.get(':stream/last', function (req, res) {
  const stream = req.pathParams.stream;
  let snapshot
  try {
    snapshot = Snapshot.getLast(stream)
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(snapshot);
}, 'detail')
.pathParam('stream', keySchema)
.response(Snapshot, 'The snapshot.')
.summary('Fetch a snapshot')
.description(dd`
  Retrieves a snapshot by its key.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    snapshots.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a snapshot')
.description(dd`
  Deletes a snapshot from the database.
`);
