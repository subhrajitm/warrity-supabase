# Warrity API

The backend API for the Warrity Warranty Management System.

## Overview

This API provides all the necessary endpoints for the Warrity application, including user authentication, warranty management, product management, calendar events, and admin functionality.

## Technologies Used

- Node.js (v16+)
- Express.js
- MongoDB
- JWT Authentication
- Helmet for security
- Compression
- Winston for logging
- Express Rate Limit
- Swagger for API documentation
- Docker & Docker Compose (for production deployment)

## Getting Started

### Prerequisites

- Node.js v16 or higher
- MongoDB (local installation or MongoDB Atlas)
- Docker and Docker Compose (for production deployment)

### Installation

1. Clone the repository
2. Navigate to the API directory:
   ```
   cd api
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```
5. Update the `.env` file with your configuration
6. Start the development server:
   ```
   npm run dev
   ```

## API Documentation

The API is documented using Swagger. Once the server is running, you can access the documentation at:

```
http://localhost:5001/api-docs/
```

The documentation includes:
- Detailed descriptions of all endpoints
- Request and response schemas
- Authentication requirements
- Example requests and responses
- Testing endpoints directly from the UI

The Swagger documentation is organized into the following sections:
- Authentication
- Users
- Warranties
- Products
- Events
- Admin

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout a user

### Health Checks
- `GET /api/health` - Basic health check endpoint that returns server status, uptime, and system information
- `GET /api/health/deep` - Deep health check that includes database connection status

### User Management
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)
- `POST /api/users/:id/profile-picture` - Upload profile picture

### Warranty Management
- `GET /api/warranties` - Get all warranties for current user
- `POST /api/warranties` - Create a new warranty
- `GET /api/warranties/:id` - Get warranty by ID
- `PUT /api/warranties/:id` - Update warranty
- `DELETE /api/warranties/:id` - Delete warranty
- `GET /api/warranties/expiring` - Get warranties expiring soon

### Product Management
- `GET /api/products` - Get all products
- `POST /api/products` - Create a new product (admin only)
- `GET /api/products/:id` - Get product by ID
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)
- `GET /api/products/categories` - Get all product categories

### Calendar Events
- `GET /api/events` - Get all events for current user
- `POST /api/events` - Create a new event
- `GET /api/events/:id` - Get event by ID
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `GET /api/events/date/:date` - Get events for a specific date

### Admin Functionality
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/warranties` - Get all warranties
- `GET /api/admin/products` - Get all products
- `GET /api/admin/events` - Get all events

## Production Deployment Options

### Using Node.js Directly
1. Set up environment variables:
   ```
   cp .env.example .env.production
   ```
2. Edit `.env.production` with your production settings
3. Start the server:
   ```
   NODE_ENV=production node src/server.js
   ```

### Using the Server Control Script
We provide a convenient server control script to manage the API server:

1. Make the script executable (if not already):
   ```
   chmod +x server-control.sh
   ```

2. Available commands:
   - Start the server: `./server-control.sh start`
   - Stop the server: `./server-control.sh stop`
   - Restart the server: `./server-control.sh restart`
   - Check server status: `./server-control.sh status`

The script automatically creates a PID file and logs server output to `logs/server.log`.

### Using PM2 (Process Manager)
1. Install PM2 globally:
   ```
   npm install -g pm2
   ```
2. Start the server with PM2:
   ```
   NODE_ENV=production pm2 start src/server.js --name warrity-api
   ```
3. Or use the ecosystem config:
   ```
   NODE_ENV=production pm2 start ecosystem.config.js
   ```

### Using Docker
1. Build and start the Docker containers:
   ```
   docker-compose build
   docker-compose up -d
   ```
2. Or use the deployment script:
   ```
   ./deploy.sh
   ```

## SSL Configuration

For production deployment with HTTPS:

1. Create a directory for SSL certificates:
   ```
   mkdir -p nginx/ssl
   ```
2. Place your SSL certificates in the `nginx/ssl` directory:
   - `warrity.crt` - SSL certificate
   - `warrity.key` - SSL private key
3. Update the `CORS_ORIGIN` in your `.env.production` file to match your frontend domain.

## File Structure

```
api/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   └── server.js         # Entry point
├── nginx/                # Nginx configuration
│   └── conf.d/           # Nginx site configurations
├── logs/                 # Application logs
├── uploads/              # Uploaded files
├── .env                  # Environment variables
├── .env.production       # Production environment variables
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker Compose configuration
├── ecosystem.config.js   # PM2 configuration
├── deploy.sh             # Deployment script
├── server-control.sh     # Server control script
├── package.json          # Dependencies and scripts
└── README.md             # Documentation
```

## Security Considerations

The API includes several security features:

- JWT authentication
- Password hashing with bcrypt
- CORS protection
- Rate limiting
- Helmet for HTTP headers
- Input validation with Express Validator
- HTTPS support with Nginx
- Secure environment variable handling

## Monitoring and Logging

- Winston logger for application logs
- Morgan for HTTP request logging
- PM2 for process management and monitoring
- Docker logs for containerized deployment
- Health check endpoints for monitoring

## Troubleshooting

### MongoDB Connection Issues

If you encounter MongoDB connection errors:

1. Ensure MongoDB is running on your system
2. Check your MongoDB connection string in the .env file
3. If using MongoDB Atlas, ensure your IP address is whitelisted in the Atlas dashboard
4. Check network connectivity to your MongoDB instance

### API Endpoint Testing

You can test the API endpoints using tools like:
- [Postman](https://www.postman.com/)
- [Insomnia](https://insomnia.rest/)
- cURL commands from the terminal

Example cURL command to test the health endpoint:
```
curl http://localhost:5001/api/health
```

### Docker Issues

If you encounter issues with Docker deployment:

1. Check Docker logs:
   ```
   docker-compose logs
   ```
2. Ensure ports are not already in use:
   ```
   lsof -i :5001
   ```
3. Verify environment variables are correctly set in `.env.production`

## Performance Optimization

The API includes several performance optimizations:

- Compression middleware
- MongoDB connection pooling
- Proper error handling
- Static file caching
- PM2 clustering for multi-core utilization