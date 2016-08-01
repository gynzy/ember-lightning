const bunyan = require('bunyan');
const redis = require('../../modules/redis');
const cache = require('../../modules/cache');
let log = bunyan.createLogger({
	name: 'post-revision'
});

/*
 * PUT /ember-revisions/<id>
 * Activates the revision with key id (leerling:hash)
 */
module.exports = async(ctx, next) => {
	let pathParts = ctx.path.split('/');
	if (ctx.method === 'PUT' && pathParts[1] === 'ember-revisions' && pathParts[2] !== undefined) {
		// fetch the full index from the url
		let rev = pathParts[2];
		let index = await redis.client.get(rev);
		// get the 'leerling' part
		let appPrefix = rev.split(':')[0];
		if (index) {
			// change the current-content to this index.html
			// change the current to this hash (rev)
			let currentKey = appPrefix + ':' + redis.currentKey;
			let currentContentKey = appPrefix + ':' + redis.currentContentKey;
			try {
        // update redis
				await redis.client.set(currentKey, rev);
        // update cache
				cache.set(currentKey, rev);
				await redis.client.set(currentContentKey, index);
				cache.set(currentContentKey, index);
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
};
