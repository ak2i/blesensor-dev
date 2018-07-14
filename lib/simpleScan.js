var util = require('util');
var noble = require('noble');

noble.on('stateChange', function(state){
	console.log('State:' + state);
	if (state == 'poweredOn') {
		noble.on('discover', function(peripheral){
			console.log('Peripheral:');
			//console.log(util.inspect(peripheral,{depth:null}));
			console.log('  UUID:' + peripheral.uuid);
			//console.log('  Advertisement:');
			//console.log(util.inspect(peripheral.advertisement,{depth:null}));
			console.log('  RSSI:' + peripheral.rssi);
		});
		console.log('Start Scanning.');
		noble.startScanning();
	} else {
		console.log('Stop Scanning.');
		noble.stopScanning();
	}
});
