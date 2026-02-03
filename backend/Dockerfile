FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
# Remove backend prefix from start script if running in context of pure backend container?
# backend/package.json has "start": "node src/server.js" which is correct for being inside /app (where src is).

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
