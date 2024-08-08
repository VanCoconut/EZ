# Use the official Node.js image as a base
FROM node:14

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY . .

RUN npm install

# Expose port 3001 to the outside world
EXPOSE 3001

# Command to run the server application
CMD ["npm", "start"]
