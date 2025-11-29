FROM node:18-alpine

WORKDIR /app

# Copy everything first to debug
COPY . .

# Install dependencies
RUN npm install --omit=dev

# Expose the port
EXPOSE 8080

# Start the application
CMD ["node", "server.js"]