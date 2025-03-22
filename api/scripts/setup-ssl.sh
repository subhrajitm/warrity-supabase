#!/bin/bash

# Create necessary directories
mkdir -p nginx/ssl/live/api.warrity.com

# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-nginx
fi

# Get SSL certificate
echo "Getting SSL certificate..."
sudo certbot certonly --standalone \
    -d api.warrity.com \
    --non-interactive \
    --agree-tos \
    --email your-email@example.com \
    --cert-path nginx/ssl/live/api.warrity.com/fullchain.pem \
    --key-path nginx/ssl/live/api.warrity.com/privkey.pem

# Set proper permissions
sudo chown -R $USER:$USER nginx/ssl
chmod -R 755 nginx/ssl

echo "SSL setup complete!" 