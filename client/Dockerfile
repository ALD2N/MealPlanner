# Dev stage
FROM node:18-alpine AS dev
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* tsconfig.json ./
COPY shared ./shared
COPY client ./client
RUN cd client && npm install && cd ..
EXPOSE 5173
CMD ["/bin/sh", "-c", "cd client && npm run dev"]

# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* tsconfig.json ./
COPY shared ./shared
COPY client ./client
RUN cd client && npm install && npm run build && cd ..

# Production stage
FROM nginx:alpine
COPY --from=build /app/client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
