'use strict';

const redis = require('then-redis'),
	Koa = require('koa');

const redisOptions = {
	host: process.env.REDIS_HOST,
	port: process.env.REDIS_PORT,
	password: process.env.REDIS_SECRET
};

const app = exports.app = new Koa(),
	client = redis.createClient(redisOptions);

client.on('error', function (err) {
	console.log('Redis client error: ' + err);
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
