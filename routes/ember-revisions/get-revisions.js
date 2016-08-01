const bunyan = require('bunyan');
const redis = require('../../modules/redis');
let log = bunyan.createLogger({
	name: 'revisions'
});
/*
 * GET /ember-revisions
 * returns a JSON array of objects for the stored revisions. Fields are id (revision key), created_at (upload timestamp), and current (boolean)
 */
module.exports = async(ctx, next) => {
	if (ctx.method === 'GET' && ctx.path === '/ember-revisions') {
		log.info('Fetching revisions for app: ', ctx.request.query.prefix);
		let appPrefix = ctx.request.query.prefix || 'leerling';
		try {
			let revisions = await redis.client.zrevrange(appPrefix + ':' + redis.listKey, 0, -1, 'withscores');
			let map = [];
			let current = await redis.client.get(appPrefix + ':' + redis.currentKey);
			for (let i = 0; i < revisions.length; i += 2) {
				map.push({
					id: revisions[i],
					created_at: new Date(parseInt(revisions[i + 1], 10)),
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
};
