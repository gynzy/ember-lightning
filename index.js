'use strict';

const Koa = require('koa');


console.log('process.env.REDIS_HOST', process.env.REDIS_SENTINEL_SERVICE_HOST);
console.log('process.env.REDIS_PORT', process.env.REDIS_SENTINEL_SERVICE_PORT);
console.log('process.env.REDIS_SECRET', process.env.REDIS_SECRET);

const app = exports.app = new Koa();

var client = require('ioredis')({
	sentinels: [{
		host: process.env.REDIS_SENTINEL_SERVICE_HOST,
		port: process.env.REDIS_SENTINEL_SERVICE_PORT
	}],
	name: 'mymaster',
	password: process.env.REDIS_SECRET,
	db: 1
});

app.use(async ctx => {

	var indexkey;

	if (ctx.query.index_key) {
		indexkey = process.env.APP_NAME + ':index:' + ctx.query.index_key;
	} else {
		indexkey = process.env.APP_NAME + ':index:current-content';
	}

	var index = await client.get(indexkey);
	if (index) {
		ctx.body = index;
	} else {
		ctx.status = 404;
	}
});

console.log('Starting server for: ', process.env.APP_NAME);
var port = process.env.PORT || 3000;
var server = app.listen(port);
console.log('Server running on port ', port);

process.on('SIGINT', function () {
	server.close(function () {
		process.exit(0);
	});
});
