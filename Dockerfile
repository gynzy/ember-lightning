FROM node:4-onbuild

EXPOSE 3000

ENV APP_NAME "leerling"
ENV REDIS_PORT 6379
ENV REDIS_HOST redis

CMD [ "./node_modules/.bin/babel-node", "index.js" ]
