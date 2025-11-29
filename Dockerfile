FROM node:18-alpine

WORKDIR /app


COPY . .


RUN npm install --omit=dev


EXPOSE 8080


CMD ["node", "server.js"]