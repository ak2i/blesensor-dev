var bleno = require('bleno');

var uuid = 'c9c50d766b234943bd505ce073cbbe4f';
var major = 0;
var minor = 123;
var base_rssi = -50;

bleno.on('stateChange', function(state){
	console.log('State:' + state);
	if (state == 'poweredOn') {
		bleno.startAdvertisingIBeacon(uuid, major, minor, base_rssi, function(err){
			if (err) {
				console.error(err);
			} else {
				console.log('Broadcasting iBeacon ' + uuid + ', ' + major + ', ' + minor);
			}
		});
	} else {
		console.log('Stop Scanning.');
		bleno.stopAdvertising();
	}
});
