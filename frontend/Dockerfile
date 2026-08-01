FROM node:26.5.1-alpine3.24 as build
RUN apk update && apk upgrade --no-cache

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .

# Build with production API URL
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Clear Vite cache before building
RUN rm -rf node_modules/.vite .vite

RUN npm run build

# List what was actually built
RUN ls -lah /app/dist/assets/
# Production stage with nginx (non-root image, listens on 8080)
FROM nginxinc/nginx-unprivileged:1.30.4-alpine3.24

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
