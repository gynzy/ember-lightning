const bunyan = require('bunyan');
const redis = require('../modules/redis');
const cache = require('../modules/cache');
let log = bunyan.createLogger({
	name: 'index'
});

const DOMAIN_APP_MAPPING = {
	'https://www.gynzykids.com': 'leerling',
	'https://kids.gynzy.com': 'leerling',
	'https://leerling.gynzykids.com': 'leerling'
};

/*
 * GET / (current-content)
 * param: prefix (ember app name)
 * param: revision (revision hash)
 */
module.exports = async(ctx, next) => {
	if (ctx.method === 'GET' && ctx.path === '/') {
		let indexkey;
		let appPrefix = ctx.request.query.prefix;
		if (!appPrefix) {
			// TODO move the domain key/value list to redis and add endpoint to add them on-the-fly
			if (DOMAIN_APP_MAPPING.hasOwnProperty(ctx.request.origin)) {
				appPrefix = DOMAIN_APP_MAPPING[ctx.request.origin];
			} else {
				// As a fallback we serve the leerling index
				appPrefix = 'leerling';
			}
		}
		let revision = ctx.query.revision;
		if (revision) {
			indexkey = appPrefix + ':' + revision;
		} else {
			indexkey = appPrefix + ':' + redis.currentContentKey;
		}
		let index;
		try {
			index = await redis.client.get(indexkey);
			if (index) {
				// set the backup cache for indexkey to this index on every get
				cache.set(indexkey, index);
				ctx.body = index;
				ctx.status = 200;
			} else {
				// no such key
				ctx.status = 404;
			}
		} catch (e) {
			try {
				log.info('Redis is down, using in-memory cache as fallback.', e);
				index = cache.get(indexkey);
				ctx.body = index;
				ctx.status = 200;
			} catch (e) {
				log.error('Failed to fetch key from redis and from cache.', e);
				ctx.body = 'No such key in redis or cache, Redis could be down though...';
				ctx.status = 500;
			}
		}
	} else {
		await next();
	}
};
