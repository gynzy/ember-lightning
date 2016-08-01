const bunyan = require('bunyan');
const redis = require('../../modules/redis');
let log = bunyan.createLogger({
	name: 'post-revision'
});

/*
 * POST /ember-revisions
 * expects a JSON body with fields id (revision key e.g. leerling:hash) and body (the index.html contents)
 */
module.exports = async(ctx, next) => {
	if (ctx.method === 'POST' && ctx.path === '/ember-revisions') {
		let body = ctx.request.body;
		if (body.id && body.body) {
			let revisionKey = body.id;
			try {
				// set the new index.html to the new revisionKey
				await redis.client.set(revisionKey, body.body);
				// add this new revisionKey to the list of recent keys
				await redis.client.zadd(revisionKey.split(':')[0] + ':' + redis.listKey, new Date().getTime(), body.id);
				ctx.status = 201;
			} catch (error) {
				log.info(error);
				ctx.body = 'Error when adding new revision with index.html';
				ctx.status = 500;
			}
		} else {
			ctx.body = 'JSON body with keys id and body is required.';
			ctx.status = 400;
		}
	} else {
		await next();
	}
};
