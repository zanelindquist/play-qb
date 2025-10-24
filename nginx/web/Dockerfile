# Stage 2: Serve with Nginx
FROM nginx:latest
COPY build /usr/share/nginx/html  # Corrected path
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]