'use strict';
const db = require('@arangodb').db;
const queues = require('@arangodb/foxx/queues');
const documentCollections = [
  "events",
  "indexes",
  "groups",
  "snapshots"
  "consumers"
];

const event_col = module.context.collectionName('events');
const snapshot_col = module.context.collectionName('snapshots');
const index_col = module.context.collectionName('indexes');

for (const localName of documentCollections) {
  const qualifiedName = module.context.collectionName(localName);
  if (!db._collection(qualifiedName)) {
    db._createDocumentCollection(qualifiedName);
  } else if (module.context.isProduction) {
    console.warn(`collection ${qualifiedName} already exists. Leaving it untouched.`)
  }
}


 db[event_col].ensureIndex({ type: "persistent", fields: [ "stream", "version" ], unique: true });
 db[event_col].ensureIndex({ type: "persistent", fields: [ "correlation" ], unique: true });

 db[index_col].ensureIndex({ type: "persistent", fields: [ "stream_group", "key","value" ], unique: true });

 db[snapshot_col].ensureIndex({ type: "persistent", fields: [ "stream", "version" ], unique: false});
 db[snapshot_col].ensureIndex({ type: "persistent", fields: [ "timestamp" ], unique: false});
