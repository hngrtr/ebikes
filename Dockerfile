# Use the official Node.js 18 image as the base image
FROM node:18-slim

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
# to leverage Docker cache for dependencies
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port your app listens on (from server.js, it's 8082)
EXPOSE 8082

# Define the command to run your application
CMD ["node", "server.js"]