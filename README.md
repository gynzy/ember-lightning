# ember-lightning
Ember lightning hosting for https://github.com/ember-cli/ember-cli-deploy with https://github.com/customerio/ember-cli-deploy-rest.

# Docker support

ember-lightning is also available as a docker container. To build the container run:

```shell
docker build --tag ember-lightning .
```

Then, to serve an ember-cli application run the container:

```shell
docker run --name ls --env REST_USER=someuser --env REST_PASS=randompass --env REDIS_HOST=your-redis-server.example.com --env REDIS_PORT=6379 --REDIS_SECRET=optionalsecret ember-lightning:latest
```

# ember-cli-deploy-rest

This service has endpoints that work with ember-cli-deploy-rest (https://github.com/customerio/ember-cli-deploy-rest). Use `REST_USER` and `REST_PASS` to define the basic auth for the endpoints and use those in your `deploy.js` configuration.

# Sentinel support

This service can work with a sentinel setup. Use `REDIS_SENTINEL_SERVICE_HOST` and `REDIS_SENTINEL_SERVICE_PORT` instead of `REDIS_HOST` and `REDIS_PORT` in your environment.
