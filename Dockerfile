# Stage 1: Build the React Frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Setup Apache/PHP and serve the App
FROM php:8.2-apache

# Install PostgreSQL extensions
RUN apt-get update && apt-get install -y libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql pgsql

# Enable Apache rewrite module
RUN a2enmod rewrite

# Copy built React app from Stage 1
COPY --from=frontend-build /app/dist /var/www/html/

# Copy the PHP API logic
COPY ./api /var/www/html/api

# Copy a global .htaccess to handle React React Router
RUN echo "<IfModule mod_rewrite.c>\n\
    RewriteEngine On\n\
    # API Routes bypass to the api folder\n\
    RewriteRule ^api/(.*)$ api/index.php [L]\n\
    # React Router fallback\n\
    RewriteCond %{REQUEST_FILENAME} !-f\n\
    RewriteCond %{REQUEST_FILENAME} !-d\n\
    RewriteRule . /index.html [L]\n\
</IfModule>" > /var/www/html/.htaccess

# Set permissions
RUN chown -R www-data:www-data /var/www/html/
