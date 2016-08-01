/*
 * GET /health
 */
 module.exports = async(ctx, next) => {
	if (ctx.method === 'GET' && ctx.path === '/health') {
		ctx.body = 'ok';
		ctx.status = 200;
	} else {
		await next();
	}
};
