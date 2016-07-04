'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Snapshot = require('../models/snapshot');

const snapshots = module.context.collection('snapshots');
const keySchema = joi.string().required()
.description('The key of the snapshot');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;

const NewSnapshot = Object.assign({}, Snapshot, {
  schema: Object.assign({}, Snapshot.schema, {
    _from: joi.string(),
    _to: joi.string()
  })
});


router.get(function (req, res) {
  res.send(snapshots.all());
}, 'list')
.response([Snapshot], 'A list of snapshots.')
.summary('List all snapshots')
.description(dd`
  Retrieves a list of all snapshots.
`);


router.post(function (req, res) {
  const snapshot = req.body;
  let meta;
  try {
    meta = snapshots.save(snapshot._from, snapshot._to, snapshot);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(snapshot, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: snapshot._key})
  ));
  res.send(snapshot);
}, 'create')
.body(NewSnapshot, 'The snapshot to create.')
.response(201, Snapshot, 'The created snapshot.')
.error(HTTP_CONFLICT, 'The snapshot already exists.')
.summary('Create a new snapshot')
.description(dd`
  Creates a new snapshot from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let snapshot
  try {
    snapshot = snapshots.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(snapshot);
}, 'detail')
.pathParam('key', keySchema)
.response(Snapshot, 'The snapshot.')
.summary('Fetch a snapshot')
.description(dd`
  Retrieves a snapshot by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const snapshot = req.body;
  let meta;
  try {
    meta = snapshots.replace(key, snapshot);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(snapshot, meta);
  res.send(snapshot);
}, 'replace')
.pathParam('key', keySchema)
.body(Snapshot, 'The data to replace the snapshot with.')
.response(Snapshot, 'The new snapshot.')
.summary('Replace a snapshot')
.description(dd`
  Replaces an existing snapshot with the request body and
  returns the new document.
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
