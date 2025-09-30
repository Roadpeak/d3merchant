# ==========================================
# MERCHANTS DOCKERFILE (Vite React)
# ==========================================
# Save this as: Dockerfile in your /merchants directory

# Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine

# Copy built files (Vite builds to /dist by default)
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config for React Router support
RUN echo 'server {\n\
    listen 80;\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]