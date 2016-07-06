'use strict';
const db = require('@arangodb').db;
const documentCollections = [
  "events",
  "indexes",
  "groups",
  "logs",
  "snapshots"
];

for (const localName of documentCollections) {
  const qualifiedName = module.context.collectionName(localName);
  if (!db._collection(qualifiedName)) {
    db._createDocumentCollection(qualifiedName);
  } else if (module.context.isProduction) {
    console.warn(`collection ${qualifiedName} already exists. Leaving it untouched.`)
  }
}

 db.es_events.ensureIndex({ type: "persistent", fields: [ "stream", "version" ], unique: true });
 db.es_indexes.ensureIndex({ type: "persistent", fields: [ "stream_group", "key","value" ], unique: true });
 db.es_snapshots.ensureIndex({ type: "persistent", fields: [ "stream", "version" ], unique: false});
 db.es_snapshots.ensureIndex({ type: "persistent", fields: [ "timestamp" ], unique: false});
