FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for Vite build)
RUN npm install

# Copy source code
COPY . .

# Build the Vite frontend
RUN npm run build

# Expose the port Cloud Run expects
EXPOSE 8080

# Cloud Run sets the PORT environment variable
ENV PORT=8080

# Start the Express server
CMD ["node", "server.js"]
