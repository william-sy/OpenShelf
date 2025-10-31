FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy application files
COPY . .

# Create data directory for database and uploads
RUN mkdir -p /app/data /app/uploads

EXPOSE 3001

# Initialize database and start server
CMD ["sh", "-c", "node src/scripts/initDatabase.js && node src/server.js"]
