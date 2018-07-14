var util = require('util');
var noble = require('noble');

noble.on('stateChange', function(state){
	console.log('State:' + state);
	if (state == 'poweredOn') {
		noble.on('discover', function(peripheral){
			if (peripheral.advertisement !== undefined && peripheral.advertisement.manufacturerData !== undefined) {
				var buf = peripheral.advertisement.manufacturerData;
				if (buf.slice(0,4).toString('hex') == '4c000215') {
					console.log('iBeacon:');
					var ib_uuid = buf.slice(4,20).toString('hex');
					var ib_major = buf.readInt16BE(20);
					var ib_minor = buf.readInt16BE(22);
					var ib_rssi = buf.readInt8(24);
					console.log('  uuid:' + ib_uuid);
					console.log('  major:' + ib_major);
					console.log('  minor:' + ib_minor);
					console.log('  base_rssi:' + ib_rssi);
					console.log('  RSSI:' + peripheral.rssi);
				} else {
					console.log('advertisement.manufacturerData:');
					console.log('  ' + buf.toString('hex'));
				}
			}
		});
		console.log('Start Scanning.');
		noble.startScanning([],true);
	} else {
		console.log('Stop Scanning.');
		noble.stopScanning();
	}
});
