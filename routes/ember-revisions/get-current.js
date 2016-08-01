const bunyan = require('bunyan');
const redis = require('../../modules/redis');
let log = bunyan.createLogger({
	name: 'current'
});
/*
 * GET /ember-revisions/current?prefix=app
 * returns a JSON array of objects for the stored revisions. Fields are id (revision key), created_at (upload timestamp), and current (boolean)
 */
module.exports = async(ctx, next) => {
	if (ctx.method === 'GET' && ctx.path === '/ember-revisions/current') {
		log.info('Fetching current revision for app: ', ctx.request.query.prefix);
		let appPrefix = ctx.request.query.prefix || 'leerling';
		try {
			let current = await redis.client.get(appPrefix + ':' + redis.currentKey);
			ctx.body = {
				'current': current
			};
			ctx.status = 200;
		} catch (error) {
			log.info(error);
			ctx.body = 'Error fetching current revision from redis';
			ctx.status = 500;
		}
	} else {
		await next();
	}
};
