FROM node:18-alpine

WORKDIR /app

# Copy everything first
COPY . .

# Install dependencies
RUN npm install --omit=dev

# Expose port
EXPOSE 8080

# Start server
CMD ["node", "server.js"]