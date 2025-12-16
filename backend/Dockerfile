FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (use npm install if lock file doesn't exist)
RUN npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 3001

# Development command (will be overridden by docker-compose)
# Skip build for development, nest start --watch will compile on the fly
CMD ["npm", "run", "dev"]
