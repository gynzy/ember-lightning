FROM node:4-onbuild

EXPOSE 3000

ENV APP_NAME "leerling"

CMD [ "./node_modules/.bin/babel-node", "index.js" ]
