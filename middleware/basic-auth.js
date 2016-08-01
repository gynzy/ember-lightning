const basicAuth = require('basic-auth');
const auth = {
	name: process.env.REST_USER,
	pass: process.env.REST_PASS
};

/*
 * Require basisc auth on all ember-revisions routes
 */
module.exports = async(ctx, next) => {
	if (ctx.path !== '/' && ctx.path !== '/health') {
		let user = basicAuth(ctx);
		console.log(auth.name, auth.pass);
		if (user && user.name === auth.name && user.pass === auth.pass) {
			await next();
		} else {
			ctx.status = 401;
			ctx.body = 'Access denied: need basic-auth user/pass';
		}
	} else {
		// no auth for fetching the index
		await next();
	}
};
