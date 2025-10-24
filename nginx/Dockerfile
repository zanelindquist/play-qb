# # Stage 1: Build React Native Web app
# FROM node:18 as builder

# # Set working directory inside the container
# WORKDIR /react-native-app

# # Copy package.json and package-lock.json
# COPY package.json package-lock.json ./

# # Install dependencies
# RUN npm install

# # Copy the rest of the app's source code
# COPY . .

# # Build the React Native web app
# RUN npm run build


# Now for the NGINX proxy
FROM nginx:latest

# Install OpenSSL
RUN apt-get update && apt-get install -y openssl && apt-get clean

# Copy SSL certificates into the container
# COPY server.crt /etc/ssl/certs/server.crt
# COPY server.key /etc/ssl/private/server.key

COPY ./certs /etc/ssl/certs

# Copy default configuration
COPY default.conf /etc/nginx/conf.d/

COPY --from=builder /react-native-app/dist /usr/share/nginx/html

# Expose ports for HTTP and HTTPS
EXPOSE 80 443

# Run the script to generate certificates before starting Nginx
CMD ["/bin/bash", "-c", "/usr/local/bin/generate-certs.sh && nginx -g 'daemon off;'"]