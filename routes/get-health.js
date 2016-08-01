const redis = require('../modules/redis');
const cache = require('../modules/cache');
const bunyan = require('bunyan');
let log = bunyan.createLogger({
	name: 'cache'
});

/*
 * GET /health which checks redis actually works
 */
module.exports = async(ctx, next) => {
	if (ctx.method === 'GET' && ctx.path === '/health') {
		let key;
		let indexkey = 'leerling:current';
		try {
			key = await redis.client.get(indexkey);
			ctx.body = indexkey + ' => ' + key;
			ctx.status = 200;
		} catch (e) {
			try {
				// redis is down, fetch the key from the in-memory cache
				key = cache.get(indexkey);
			} catch (e) {
				log.error('Failed to fetch default key from redis and from cache.', e);
			}
			ctx.body = 'Cannot fetch leerling:current from redis';
			ctx.status = 500;
		}
	} else {
		await next();
	}
};
