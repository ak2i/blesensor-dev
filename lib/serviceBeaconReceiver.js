const util = require('util'),
	RawStepper = require('./common').RawStepper,
	https = require(process.env.APIProtocol),
	noble = require('noble');

const opt_generateReceiver = {
	hostname : process.env.APIHost,
	port : process.env.APIPort,
	path : process.env.APIPath + 'generateReceiver',
	method : 'POST',
	headers : {
		'x-api-key' : process.env.APIKey,
		'Content-Type' : 'application/json',
		'Content-Length' : 0
	}
};

const opt_getReceiver = {
	hostname : process.env.APIHost,
	port : process.env.APIPort,
	path : process.env.APIPath + 'getReceiver',
	method : 'POST',
	headers : {
		'x-api-key' : process.env.APIKey,
		'Content-Type' : 'application/json',
		'Content-Length' : 0
	}
};

const opt_postReceiverEvidence = {
	hostname : process.env.APIHost,
	port : process.env.APIPort,
	path : process.env.APIPath + 'postReceiverEvidence',
	method : 'POST',
	headers : {
		'x-api-key' : process.env.APIKey,
		'Content-Type' : 'application/json',
		'Content-Length' : 0
	}
};

const receiver_profile = {
	track : {
		receiver : {
			class : "FCPBLEReceiver2018",
			label : "TEST001"
		},
		project : {
			name : "general"
		}
	},
	timeWindow : {
	},
	place : {
	},
	value : {
		receiver : {
			intervalSeconds : 10,
			evidence : {}
		}
	}
};

var evidence_buffer = {};

const doPostReceiverEvidence = function() {
	var buf = {};
	var togo = false;
	for (var dtkey in evidence_buffer) {
		buf[dtkey] = [];
		for (var ibkey in evidence_buffer[dtkey]) {
			togo = true;
			buf[dtkey].push(evidence_buffer[dtkey][ibkey]);
		}
	}
	if (togo == true) {
		const reqobj = {
			track : {
				receiver : {
					id : receiver_profile.track.receiver.id,
					key : receiver_profile.track.receiver.key
				}
			},
			value : {
				receiver : {
					evidence : buf
				}
			}
		};
		opt_postReceiverEvidence.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(reqobj));
		const req = https.request(opt_postReceiverEvidence, (res) => {
			var resBody = '';
			res.setEncoding('utf8');
			res.on('error', (e) => {
				console.error((new Date()).toISOString() + ' Error:');
				console.error(e);
			});
			res.on('data', (chunk) => {
				resBody += chunk;
			});
			res.on('end', () => {
				var resobj = JSON.parse(resBody);
				const status = {
					result : true,
					errors : []
				};
				var val = null;
				RawStepper._isEqual(status,resobj,'meta.response.authenticate',true);
				RawStepper._isEqual(status,resobj,'meta.response.accepted',true);
				RawStepper._isEqual(status,resobj,'meta.response.succeed',true);
				val = RawStepper._isNumber(status,resobj,'value.receiver.intervalSeconds');
				if (typeof val == 'number') {
					receiver_profile.value.receiver.intervalSeconds = val;
				}
				console.log((new Date()).toISOString() + ' PostReceiverEvidence:');
				if (status.result == true) {
					//console.log(util.inspect(resobj,{depth:null}));
					console.log('Clear evidence buffer.');
					evidence_buffer = {};
				} else {
					console.error('Error has found on response of postReceiverEvidence API call.');
					console.error(util.inspect(status.errors));
					console.error(util.inspect(reqobj,{depth:null}));
				}
			});
		});
		req.on('error', (e) => {
			console.error('Error has occured while postReceiverEvidence API call.');
			console.error(e);
		});
		req.write(JSON.stringify(reqobj));
		req.end();
	} else {
		console.log((new Date()).toISOString() + ' No PostReceiverEvidence: empty buffer');
	}
	setTimeout(doPostReceiverEvidence, receiver_profile.value.receiver.intervalSeconds * 1000);
}

opt_generateReceiver.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(receiver_profile));
const req = https.request(opt_generateReceiver, (res) => {
	var resBody = '';
	res.setEncoding('utf8');
	res.on('error', (e) => {
		console.error((new Date()).toISOString() + ' Error:');
		console.error(e);
	});
	res.on('data', (chunk) => {
		resBody += chunk;
	});
	res.on('end', () => {
		var resobj = JSON.parse(resBody);
		const status = {
			result : true,
			errors : []
		};
		var val = null;
		RawStepper._isEqual(status,resobj,'meta.response.succeed',true);
		val = RawStepper._isString(status,resobj,'track.receiver.id');
		if (val !== null) receiver_profile.track.receiver.id = val;
		val = RawStepper._isString(status,resobj,'track.receiver.key');
		if (val !== null) receiver_profile.track.receiver.key = val;
		val = RawStepper._isNumber(status,resobj,'value.receiver.intervalSeconds');
		if (typeof val == 'number') {
			receiver_profile.value.receiver.intervalSeconds = val;
		}
		if (status.result == true) {
			console.log((new Date()).toISOString() + ' ReceiverRegistrated:');
			console.log('  ID: ' + encodeURIComponent(receiver_profile.track.receiver.id));
			console.log('  KEY: ' + encodeURIComponent(receiver_profile.track.receiver.key));
			// start BLE Scan
			noble.on('stateChange', function(state){
				if (state == 'poweredOn') {
					noble.on('discover', function(peripheral){
						if (peripheral.advertisement !== undefined && peripheral.advertisement.manufacturerData !== undefined) {
							var buf = peripheral.advertisement.manufacturerData;
							if (buf.slice(0,4).toString('hex') == '4c000215') {
								//console.log('iBeacon:');
								var ib_uuid = buf.slice(4,20).toString('hex');
								var ib_major = buf.readInt16BE(20);
								var ib_minor = buf.readInt16BE(22);
								var ib_rssi = buf.readInt8(24);
								//console.log('  uuid:' + ib_uuid);
								//console.log('  major:' + ib_major);
								//console.log('  minor:' + ib_minor);
								//console.log('  base_rssi:' + ib_rssi);
								//console.log('  RSSI:' + peripheral.rssi);
								const ib_key = ib_uuid + '-' + ib_major + '-' + ib_minor;
								const dtkey = new Date(Math.floor((new Date()).getTime() / (receiver_profile.value.receiver.intervalSeconds * 1000)) * receiver_profile.value.receiver.intervalSeconds * 1000).toISOString();
								if (evidence_buffer[dtkey] == undefined) evidence_buffer[dtkey] = {};
								evidence_buffer[dtkey][ib_key] = [ib_uuid, ib_major, ib_minor, peripheral.rssi, ib_rssi];
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
			// start postReceiverEvidence loop
			doPostReceiverEvidence();
			// start Receiver Information watching
			setInterval(function(){
				const reqobj = {
					track : {
						receiver : {
							id : receiver_profile.track.receiver.id,
							key : receiver_profile.track.receiver.key
						}
					}
				};
				opt_getReceiver.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(reqobj));
				const req = https.request(opt_getReceiver, (res) => {
					var resBody = '';
					res.setEncoding('utf8');
					res.on('error', (e) => {
						console.error((new Date()).toISOString() + ' Error:');
						console.error(e);
					});
					res.on('data', (chunk) => {
						resBody += chunk;
					});
					res.on('end', () => {
						var resobj = JSON.parse(resBody);
						const status = {
							result : true,
							errors : []
						};
						var val = null;
						RawStepper._isEqual(status,resobj,'meta.response.authenticate',true);
						RawStepper._isEqual(status,resobj,'meta.response.succeed',true);
						RawStepper._isEqual(status,resobj,'track.receiver.id',receiver_profile.track.receiver.id);
						val = RawStepper._isNumber(status,resobj,'value.receiver.intervalSeconds');
						if (typeof val == 'number') {
							receiver_profile.value.receiver.intervalSeconds = val;
						}
						console.log((new Date()).toISOString() + ' Info:');
						console.log(util.inspect(resobj,{depth:null}));
					});
				});
				req.on('error', (e) => {
					console.error('Error has occured while getReceiver API call.');
					console.error(e);
				});
				req.write(JSON.stringify(reqobj));
				req.end();
			}, parseInt(process.env.GetRcvIntervalSeconds) * 1000);
		} else {
			console.error((new Date()).toISOString() + ' Error:');
			console.error(util.inspect(status.errors,{depth:null}));
			console.error('Failed to generate receiver. exit.');
			process.exit(1);
		}
	});
});
req.on('error', (e) => {
	console.error('Error has occured while generateReceiver API call.');
	console.error(e);
	console.error('Failed to generate receiver. exit.');
	process.exit(1);
});
req.write(JSON.stringify(receiver_profile));
req.end();
