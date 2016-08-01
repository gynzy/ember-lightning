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
			index = cache.get(indexkey);
		} catch (e) {
			try {
				index = await redis.client.get(indexkey);
				// set the cache for indexkey to this index
				cache[indexkey] = index;
			} catch (e) {
				log.error('Failed to fetch key from redis and from cache.', e);
			}
		}
		if (index) {
			ctx.body = index;
		} else {
			ctx.status = 404;
		}
	} else {
		await next();
	}
};
