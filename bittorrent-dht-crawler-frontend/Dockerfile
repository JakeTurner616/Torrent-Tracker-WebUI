# Base image
FROM node:20 as build

# Set environment variables
ENV EXPRESS_APP_API_BASE_URL=http://localhost:3005
ENV REACT_APP_AUTH_TOKEN=your-secret-token-for-authentication

# Install dependencies
WORKDIR /app
COPY package.json ./
RUN yarn install

# Build the application
COPY . .
RUN yarn build

# Serve the app
FROM nginx:1.23
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
