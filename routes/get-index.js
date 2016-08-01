const redis = require('../modules/redis');
/*
 * GET / (current-content)
 * param: prefix (ember app name)
 * param: revision (revision hash)
 *
 * TODO: build in-memory cache and google bucket (ember-cli-deploy-gcloud-index) fallback when redis is dead
 */
module.exports = async(ctx, next) => {
	if (ctx.method === 'GET' && ctx.path === '/') {
		let indexkey;
		// TODO determine appPrefix based on url (domains need a mapping to app names in the db here)
		// we can point gynzykids.com, kids.gynzy.com, beheer.gynzy.net, dracarys.gynzy.com, etc. to this service, it can then serve
		// each index, based on mappings to the right index in redis
		let appPrefix = ctx.request.query.prefix || 'leerling';
		let revision = ctx.query.revision;
		if (revision) {
			indexkey = appPrefix + ':' + revision;
		} else {
			indexkey = appPrefix + ':' + redis.currentContentKey;
		}
		let index = await redis.client.get(indexkey);
		if (index) {
			ctx.body = index;
		} else {
			ctx.status = 404;
		}
	} else {
		await next();
	}
};
