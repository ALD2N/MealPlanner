# Dev stage
FROM node:20-alpine AS dev
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* tsconfig.json ./
COPY shared ./shared
COPY client ./client
RUN cd client && npm install && cd ..
EXPOSE 5173
CMD ["/bin/sh", "-c", "cd client && npm run dev"]

# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* tsconfig.json ./
COPY shared ./shared
COPY client ./client
RUN set -e && \
    echo "Installing dependencies..." && \
    npm ci && \
    echo "Building client..." && \
    npm --prefix client run build && \
    echo "Build complete!"

# Production stage
FROM nginx:alpine AS prod
COPY --from=build /app/client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
