FROM node:lts-alpine

RUN adduser -S appuser

WORKDIR /app
RUN chown appuser /app

USER appuser

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build && npm run test

EXPOSE 8080
CMD ["npm", "start"]