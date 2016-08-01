const bunyan = require('bunyan');
let log = bunyan.createLogger({
	name: 'cache'
});

/*
 * Cache map with index keys
 * appPrefix:key
 */
let cache = {};

/*
 * Get a cache entry by key
 */
module.exports.get = function (indexkey) {
	if (cache.hasOwnProperty(indexkey)) {
		log.info('Cache hit for ' + indexkey);
		return cache[indexkey];
	} else {
		log.info('Cache miss for ' + indexkey);
		return;
	}
};
