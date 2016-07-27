const bunyan = require('bunyan');
const Redis = require('ioredis');
const Koa = require('koa');
const basicAuth = require('basic-auth');
const bodyParser = require('koa-bodyparser');
const logger = require('koa-logger');
const compress = require('koa-compress');
const json = require('koa-json');

const currentKey = 'current';
const currentContentKey = 'current-content';
const listKey = 'revisions';

const sentinelOptions = [{
	host: process.env.REDIS_SENTINEL_SERVICE_HOST,
	port: process.env.REDIS_SENTINEL_SERVICE_PORT
}];

let log = bunyan.createLogger({
	name: 'ember-lightning'
});

let auth = {
	name: process.env.REST_USER,
	pass: process.env.REST_PASS
};

let app = exports.app = new Koa();
let redisOptions = {
	name: 'mymaster',
	password: process.env.REDIS_SECRET,
	db: 1
};

if (sentinelOptions.host && sentinelOptions.port) {
	redisOptions.sentinels = sentinelOptions;
} else {
	redisOptions.host = process.env.REDIS_HOST;
	redisOptions.port = process.env.REDIS_PORT;
}

let client = new Redis(redisOptions);

app.use(logger());
app.use(json());
app.use(bodyParser());
app.use(compress());

/*
 * Require basisc auth on all ember-revisions routes
 */
app.use(async(ctx, next) => {
	if (ctx.path !== '/') {
		let user = basicAuth(ctx);
		if (user && user.name == auth.name && user.pass == auth.pass) {
			await next();
		} else {
			ctx.status = 401;
			ctx.body = 'Access denied: need basic-auth user/pass';
		}
	} else {
		// no auth for fetching the index
		await next();
	}
});

/*
 * GET / (current-content)
 * param: prefix (ember app name)
 * param: revision (revision hash)
 */
app.use(async(ctx, next) => {
	// fetch
	if (ctx.method === 'GET' && ctx.path === '/') {
		let indexkey;
		let appPrefix = ctx.request.query.prefix || 'leerling';
		let revision = ctx.query.revision;
		if (revision) {
			indexkey = appPrefix + ':' + revision;
		} else {
			indexkey = appPrefix + ':' + currentContentKey;
		}
		let index = await client.get(indexkey);
		if (index) {
			ctx.body = index;
		} else {
			ctx.status = 404;
		}
	} else {
		await next();
	}
});

/*
 * GET /ember-revisions
 * returns a JSON array of objects for the stored revisions. Fields are id (revision key), created_at (upload timestamp), and current (boolean)
 */
app.use(async(ctx, next) => {
	if (ctx.method === 'GET' && ctx.path === '/ember-revisions') {
		log.info('Fetching revisions for app: ', ctx.request.query.prefix);
		let appPrefix = ctx.request.query.prefix || 'leerling';
		try {
			let revisions = await client.zrevrange(appPrefix + ':' + listKey, 0, -1, 'withscores');
			let map = [];
			let current = await client.get(appPrefix + ':' + currentKey);
			for (let i = 0; i < revisions.length; i += 2) {
				map.push({
					id: revisions[i],
					created_at: new Date(parseInt(revisions[i+1], 10)),
					current: revisions[i] === current
				});
			}
			ctx.body = map;
			ctx.status = 200;
		} catch (error) {
			log.info(error);
			ctx.body = 'Error fetching revisions from redis';
			ctx.status = 500;
		}
	} else {
		await next();
	}
});

/*
 * POST /ember-revisions
 * expects a JSON body with fields id (revision key e.g. leerling:hash) and body (the index.html contents)
 */
app.use(async(ctx, next) => {
	if (ctx.method === 'POST' && ctx.path === '/ember-revisions') {
		let body = ctx.request.body;
		if (body.id && body.body) {
			let revisionKey = body.id;
			try {
				// set the new index.html to the new revisionKey
				await client.set(revisionKey, body.body);
				// add this new revisionKey to the list of recent keys
				await client.zadd(revisionKey.split(':')[0] + ':' + listKey, new Date().getTime(), body.id);
				ctx.status = 201;
			} catch (error) {
				log.info(error);
				ctx.body = 'Error when adding new revision with index.html';
				ctx.status = 400;
			}
		} else {
			ctx.body = 'JSON body with keys id and body is required.';
			ctx.status = 403;
		}
	} else {
		await next();
	}
});

/*
 * PUT /ember-revisions/<id>
 * Activates the revision with key id (leerling:hash)
 */
app.use(async(ctx, next) => {
	let pathParts = ctx.path.split('/');
	if (ctx.method === 'PUT' && pathParts[1] === 'ember-revisions' && pathParts[2] !== undefined) {
		// fetch the full index from the url
		let rev = pathParts[2];
		let index = await client.get(rev);
		// get the 'leerling' part
		let appPrefix = rev.split(':')[0];
		if (index) {
			// change the current-content to this index.html
			// change the current to this hash (rev)
			try {
				await client.set(appPrefix + ':' + currentKey, rev);
				await client.set(appPrefix + ':' + currentContentKey, index);
				ctx.status = 204;
			} catch (error) {
				log.info(error);
				ctx.body = 'Error setting current and current-content';
				ctx.status = 400;
			}
		} else {
			ctx.body = 'No such revision key';
			ctx.status = 400;
		}
	} else {
		await next();
	}
});

log.info('Starting server...');
let port = process.env.PORT || 3000;
let server = app.listen(port);
log.info('Server running on port ', port);

process.on('SIGINT', function () {
	server.close(function () {
		process.exit(0);
	});
});
