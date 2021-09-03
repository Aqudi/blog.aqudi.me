FROM node:14-alpine

WORKDIR /code
RUN apk update \
    && apk add git \
    && apk add yarn


COPY . /code
RUN yarn install
EXPOSE 8000

ENTRYPOINT ["yarn", "start"]