FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ARG DATABASE_URL=postgresql://postgres:postgres@db:5432/webhook_db
ENV DATABASE_URL=$DATABASE_URL

RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "dev"]