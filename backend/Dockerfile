FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run prisma:generate

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
