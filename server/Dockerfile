# Development stage
FROM node:18-alpine AS dev
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* ./
COPY shared ./shared
COPY server ./server
RUN cd server && npm install && cd ..
EXPOSE 5000
CMD ["npm", "--prefix", "server", "run", "dev"]

# Production stage
FROM node:18-alpine AS prod
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* ./
COPY shared ./shared
COPY server ./server
RUN npm ci --omit=dev && cd server && npm run build && cd ..
EXPOSE 5000
CMD ["npm", "--prefix", "server", "start"]
