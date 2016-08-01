const redis = require('../modules/redis');
/*
 * GET /health which checks redis actually works
 */
module.exports = async(ctx, next) => {
	if (ctx.method === 'GET' && ctx.path === '/health') {
		try {
			let key = await redis.client.get('leerling:current');
			ctx.body = 'leerling:current: ' + key;
			ctx.status = 200;
		} catch (e) {
			ctx.body = 'cannot fetch leerling:current from redis';
			ctx.status = 500;
		}
	} else {
		await next();
	}
};
