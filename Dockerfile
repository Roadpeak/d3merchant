FROM node:22-alpine AS build
WORKDIR /app

# Hardcode production environment variables
ENV VITE_API_BASE_URL=https://api.discoun3ree.com/api/v1

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
