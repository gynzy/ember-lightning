const bunyan = require('bunyan');

const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const logger = require('koa-logger');
const compress = require('koa-compress');
const json = require('koa-json');

const basicAuth = require('./middleware/basic-auth');

const getHealthRoute = require('./routes/get-health');
const getIndexRoute = require('./routes/get-index');
const getCurrentRoute = require('./routes/ember-revisions/get-current');
const getRevisionsRoute = require('./routes/ember-revisions/get-revisions');
const postRevisionRoute = require('./routes/ember-revisions/post-revision');
const putRevisionRoute = require('./routes/ember-revisions/put-revision');

let log = bunyan.createLogger({
	name: 'ember-lightning'
});

let app = exports.app = new Koa();

app.use(logger());
app.use(json());
app.use(bodyParser());
app.use(compress());

app.use(basicAuth);
app.use(getHealthRoute);
app.use(getIndexRoute);
app.use(getCurrentRoute);
app.use(getRevisionsRoute);

app.use(postRevisionRoute);
app.use(putRevisionRoute);

log.info('Starting server...');
let port = process.env.PORT || 3000;
let server = app.listen(port);
log.info('Server running on port ', port);

process.on('SIGINT', function () {
	server.close(function () {
		process.exit(0);
	});
});
