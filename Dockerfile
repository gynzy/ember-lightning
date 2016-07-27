FROM node:4-onbuild
EXPOSE 3000
CMD [ "./node_modules/.bin/babel-node", "index.js" ]
