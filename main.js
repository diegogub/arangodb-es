'use strict';

module.context.use('/stream', require('./routes/events'), 'streams');
module.context.use('/snapshots', require('./routes/snapshots'), 'snapshots');
