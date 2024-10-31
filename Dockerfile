FROM node:18-slim

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY ./dist/ ./dist/
COPY ./server.js .

EXPOSE 1337

CMD ["npm", "run", "server"]
