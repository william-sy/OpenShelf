FROM node:26.5.1-alpine3.24
RUN apk update && apk upgrade --no-cache

WORKDIR /app
# Install build dependencies required for node-gyp, plus su-exec so the
# entrypoint can drop from root to the "node" user after fixing volume
# permissions (see docker-entrypoint.sh)
RUN apk add --no-cache python3 make g++ su-exec

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy application files
COPY . .
RUN chmod +x docker-entrypoint.sh

# Create data directory for database and uploads, owned by the non-root
# "node" user built into this image (uid 1000). This covers a fresh named
# volume; docker-entrypoint.sh re-applies it on every start to also cover
# volumes that already existed with different ownership.
RUN mkdir -p /app/data /app/uploads && chown -R node:node /app

EXPOSE 3001

# Stay root at container start so the entrypoint can fix volume ownership,
# then it execs the app as the unprivileged "node" user.
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["sh", "-c", "node src/scripts/initDatabase.js && node src/server.js"]
