FROM node:22.13.1

RUN apt-get update && apt-get install -y openssl libssl-dev

WORKDIR /usr/app

COPY package*.json ./

COPY prisma prisma

RUN npm ci

COPY . .

RUN npx prisma generate

RUN npm run build

EXPOSE 4000

CMD [ "node", "dist/src/main.js" ]