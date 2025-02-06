const rpc = require('lib/rage-rpc.min.js');
require('duster/dusterJob.js');

function init() {
    rpc.triggerServer('ncw.playerReady');
}

mp.events.add('playerReady', init);
