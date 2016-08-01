const Redis = require('ioredis');
const sentinelOptions = [{
	host: process.env.REDIS_SENTINEL_SERVICE_HOST,
	port: process.env.REDIS_SENTINEL_SERVICE_PORT
}];
let redisOptions = {
	name: 'mymaster',
	password: process.env.REDIS_SECRET,
	db: 1
};

if (sentinelOptions.length > 0 && sentinelOptions[0].host && sentinelOptions[0].port) {
	redisOptions.sentinels = sentinelOptions;
} else {
	redisOptions.host = process.env.REDIS_HOST;
	redisOptions.port = process.env.REDIS_PORT;
}

let client = new Redis(redisOptions);

module.exports = {
	'client': client,
	'currentKey': 'current',
	'currentContentKey': 'current-content',
	'listKey': 'revisions'
};
