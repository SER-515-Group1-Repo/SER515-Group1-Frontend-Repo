# ---- Stage 1: Build the React App ----
# Use the official Node.js image with the version you specified
FROM node:20.19.4-alpine as builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the source code
COPY . .

# Build the application for production
# This creates a 'dist' folder with static files
RUN npm run build

# ---- Stage 2: Serve the App with Nginx ----
# Use a lightweight Nginx image
FROM nginx:stable-alpine

# Copy the build output from the 'builder' stage
COPY --from=builder /app/dist /usr/share/nginx/html

# We will create this Nginx config file next
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# The default command for the nginx image is to start the server
CMD ["nginx", "-g", "daemon off;"]