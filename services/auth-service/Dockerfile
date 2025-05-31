FROM node:24-alpine

# Common
WORKDIR /app

COPY libs/common libs/common

WORKDIR /app/libs/common

RUN npm install
RUN npm run build

# Auth Service
WORKDIR /app/services/auth-service

COPY services/auth-service/package*.json .
RUN npm install

COPY services/auth-service .

CMD ["npm", "start"]