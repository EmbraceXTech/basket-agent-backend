FROM node:22.13.1

WORKDIR /usr/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 4000

CMD [ "node", "dist/src/main.js" ]