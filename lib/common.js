/*
	RawStepper
	外部ライブラリを使わないステップ実行フレームワーク

*/

class RawStepper {
	constructor(callback) {
		this.title = 'my steps';
		this.sc = [];
		this.step = 0;
		this.ok = 0;
		this.ng = 0;
		this.passed = 0;
		this.result = [];
		this.callback = callback;
		this.context = {}; // テスト間引き継ぎ用
	}

	static _isExist(status,obj,key) {
		if (status.result == undefined) status.result = true;
		if (status.errors == undefined) status.errors = [];
		var keys = key.split('.');
		var curObj = obj;
		var curKey = []
		for(var ak of keys) {
			curKey.push(ak);
			curObj = curObj[ak];
			if (curObj == undefined) {
				status.result = false;
				status.errors.push('response object: ' + curKey.join('.') + ' is missing.');
				return null;
			}
		}
		return curObj;
	}

	static _isNotExist(status,obj,key) {
		if (status.result == undefined) status.result = true;
		if (status.errors == undefined) status.errors = [];
		var keys = key.split('.');
		var curObj = obj;
		var curKey = []
		for(var ak of keys) {
			curKey.push(ak);
			curObj = curObj[ak];
			if (curObj !== undefined) {
				status.result = false;
				status.errors.push('response object: ' + curKey.join('.') + ' is existing.');
				return curObj;
			} else {
				return null;
			}
		}
		return null;
	}

	static _isEqual(status,obj,key,val) {
		if (status.result == undefined) status.result = true;
		if (status.errors == undefined) status.errors = [];
		const curObj = RawStepper._isExist(status,obj,key);
		if (curObj !== null) {
			if (curObj == val) {
				return curObj
			} else {
				status.result = false;
				status.errors.push('response object: ' + key + ' is varied. must be ' + val + ' but ' + curObj);
			}
		} else {
			return null;
		}
	}

	static _isEqualJSON(status,obj,key,val) {
		if (status.result == undefined) status.result = true;
		if (status.errors == undefined) status.errors = [];
		const curObj = RawStepper._isExist(status,obj,key);
		if (curObj !== null) {
			if (JSON.stringify(curObj) == JSON.stringify(val)) {
				return curObj
			} else {
				status.result = false;
				status.errors.push('response object: ' + key + ' is varied. must be ' + JSON.stringify(val) + ' but ' + JSON.stringify(curObj));
			}
			return null;
		} else {
			return null;
		}
	}

	static _isInclude(status,obj,key,val) {
		if (status.result == undefined) status.result = true;
		if (status.errors == undefined) status.errors = [];
		const curObj = RawStepper._isExist(status,obj,key);
		if (curObj !== null) {
			if (Array.isArray(curObj)) {
				if (curObj.indexOf(val) >= 0) {
					return curObj;
				} else {
					status.result = false;
					status.errors.push('response object: ' + key + ' do not include ' + val + '.');
				}
			} else {
				status.result = false;
				status.errors.push('response object: ' + key + ' is not Array.');
			}
			return null;
		} else {
			return null;
		}
	}

	static _isString(status,obj,key) {
		if (status.result == undefined) status.result = true;
		if (status.errors == undefined) status.errors = [];
		const curObj = RawStepper._isExist(status,obj,key);
		if (curObj !== null) {
			if (typeof curObj == 'string') {
				return curObj
			} else {
				status.result = false;
				status.errors.push('response object: ' + key + ' is not string, but ' + typeof curObj);
				return null;
			}
		} else {
			return null;
		}
	}

	static _isNumber(status,obj,key) {
		if (status.result == undefined) status.result = true;
		if (status.errors == undefined) status.errors = [];
		const curObj = RawStepper._isExist(status,obj,key);
		if (curObj !== null) {
			if (typeof curObj == 'number') {
				return curObj
			} else {
				status.result = false;
				status.errors.push('response object: ' + key + ' is not number, but ' + typeof curObj);
				return null;
			}
		} else {
			return null;
		}
	}

	start() {
		if (this.sc.length == 0) {
			this.finish();
		} else {
			var myself = this;
			process.nextTick( function() {
				myself.sc[0].do( myself.sc[0].opt );
			});
		}
		return true;
	}

	next(stepResult) {
		if (stepResult !== null) {
			this.result.push(stepResult);
			if (stepResult.result !== undefined) {
				this.passed += 1;
				this.ok += (stepResult.result == 'OK') ? 1 : 0;
				this.ng += (stepResult.result != 'OK') ? 1 : 0;
			}
		}
		this.step += 1;
		if (this.step >= this.sc.length) {
			this.finish();
		} else {
			var myself = this;
			process.nextTick( function() {
				myself.sc[myself.step].do( myself.sc[myself.step].opt );
			});
		}
	}

	sleep_next(sleep_sec, stepResult) {
		var myself = this;
		setTimeout(function() { myself.next(stepResult); }, sleep_sec * 1000);
		return true;
	}

	finish(stepResult) {
		if (stepResult !== undefined) {
			this.result.push(stepResult);
			if (stepResult.result !== undefined) {
				this.passed += 1;
				this.ok += (stepResult.result == 'OK') ? 1 : 0;
				this.ng += (stepResult.result != 'OK') ? 1 : 0;
			}
		}
		var result = {
			finished : true,
			title : this.title,
			result : {
				stepNum : this.sc.length,
				lastStepIdx : this.step,
				okNum : this.ok,
				ngNum : this.ng,
				passedNum : this.passed
			},
			log : this.result
		};
		this.callback(result);
		return true;
	}

	abort(stepResult) {
		if (stepResult !== null) {
			this.result.push(stepResult);
			if (stepResult.result !== undefined) {
				this.passed += 1;
				this.ok += (stepResult.result == 'OK') ? 1 : 0;
				this.ng += (stepResult.result != 'OK') ? 1 : 0;
			}
		}
		var result = {
			finished : false,
			title : this.title,
			result : {
				stepNum : this.sc.length,
				lastStepIdx : this.step,
				okNum : this.ok,
				ngNum : this.ng,
				passedNum : this.passed
			},
			log : this.result
		};
		this.callback(result);
		return true;
	}
}

exports.RawStepper = RawStepper;

const _unitTestRawStepper = function() {
	var util = require( 'util' );
	const lbl = 'UnitTest(RawStepper):';
	console.log(lbl + 'start');
	// 初期化
	try {
		console.log(lbl + 'オブジェクト初期化');
		var rs = new RawStepper(function(result){
			console.log(util.inspect(result,{depth : null}));
		});
		rs.title = '単体テスト';
	} catch(e) {
		console.error(e);
		process.exit(-1);
	}
	// ステップ設定
	rs.sc.push({
		do : function(opt) {
			// next実験
			console.log(lbl + 'MyStep [' + opt.myStep + ']');
			if (opt.x == 2) {
				rs.next({result:'OK'});
			} else {
				rs.next({result:'NG'});
			}
		},
		opt : {myStep:1, x:2, y:3, z:4}
	});
	rs.sc.push({
		do : function(opt) {
			// next実験 NG
			console.log(lbl + 'MyStep [' + opt.myStep + ']');
			if (opt.x == 2) {
				rs.sleep_next(2, {result:'OK'});
			} else {
				rs.sleep_next(2, {result:'NG'});
			}
		},
		opt : {myStep:2, x:3, y:4, z:5}
	});
	rs.sc.push({
		do : function(opt) {
			// finish実験
			console.log(lbl + 'MyStep [' + opt.myStep + ']');
			rs.finish({result:'OK'});
		},
		opt : {myStep:3, x:4, y:5, z:6}
	});
	// 開始
	console.log(lbl + 'Start stepping');
	rs.start();
	// 終了
	console.log(lbl + 'finish');
}

const getLocalDatetimeSortableString = function(dt) {
	let dateString = dt.toISOString().substring(0,10);
	return `${dateString}-${('00' + dt.getHours()).substr(-2,2)}-${('00' + dt.getMinutes()).substr(-2,2)}-${('00' + dt.getSeconds()).substr(-2,2)}`;
}

exports.getLocalDatetimeSortableString = getLocalDatetimeSortableString;

const getRssMem = function() {
	let rss = process.memoryUsage().rss;
	let rssStr = '-';
	if (rss >= 1024 * 1024 * 1024 * 1024) {
		rssStr = `${Math.round((rss / (1024 * 1024 * 1024 * 1024))*100)/100}TB`;
	} else if (rss >= 1024 * 1024 * 1024) {
		rssStr = `${Math.round((rss / (1024 * 1024 * 1024))*100)/100}GB`;
	} else if (rss >= 1024 * 1024) {
		rssStr = `${Math.round((rss / (1024 * 1024))*100)/100}MB`;
	} else if (rss >= 1024) {
		rssStr = `${Math.round((rss / 1024)*100)/100}KB`;
	} else {
		rssStr = `${rss}B`;
	}
	return rssStr;
}

exports.getRssMem = getRssMem;

if ( require.main === module ) {
	_unitTestRawStepper();
}
