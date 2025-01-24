# Express backend server standalone Dockerfile 

# Stage 1: Build the application
FROM node:20 as build

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN yarn install --production=false

# Copy application code
COPY . .

# Build any production-ready assets (if needed)
# In case of a front-end build step, include it here
# For example: RUN yarn build

# Stage 2: Create a lightweight production image
FROM node:18 as production

# Set NODE_ENV to production
ENV NODE_ENV=production

# Set working directory
WORKDIR /usr/src/app

# Copy only necessary files from build stage
COPY --from=build /usr/src/app /usr/src/app

# Install only production dependencies
RUN yarn install --production

# Expose the port your application runs on
EXPOSE 3005

# Start the server
CMD ["node", "server.js"]
