# Warrity API

<div align="center">
  <p><em>Backend API for Warrity - Warranty Management System</em></p>
</div>

## Overview

This is the backend API for Warrity, a comprehensive warranty management application. The API provides endpoints for user authentication, warranty management, product management, and administrative functions.

## Features

### Authentication
- User registration and login
- JWT-based authentication
- Role-based access control (User, Admin)
- Password hashing and security

### Warranty Management
- CRUD operations for warranties
- Warranty status tracking
- Warranty expiration notifications
- Warranty history and audit logs

### Product Management
- Product catalog management
- Product categories
- Product search and filtering
- Product warranty associations

### User Management
- User profile management
- User preferences
- User activity tracking
- Admin user management

### Admin Features
- System-wide analytics
- User management
- Product management
- Warranty oversight
- System configuration

## Dependency Management

Warrity includes a robust dependency management system to prevent "module not found" errors and ensure all required packages are properly installed:

### Automatic Dependency Checking

- **Pre-dev/Pre-build Checks**: Automatically checks for missing dependencies before running development or build commands
- **Custom Error Page**: A helpful error page that displays detailed information about missing packages
- **Import Validation Tool**: A utility to scan the codebase for imports and validate them against package.json
- **Pre-commit Hook**: Prevents commits when missing dependencies are detected

### Usage

- **Checking Dependencies**: `npm run check-deps`
- **Validating Imports**: `npm run validate-imports`

These tools help maintain a consistent development environment and reduce build failures due to missing packages.

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT
- **API Documentation**: Swagger/OpenAPI
- **File Upload**: Multer
- **Logging**: Winston
- **Validation**: Joi
- **Testing**: Jest

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- MongoDB 6.x or higher
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/subhrajitm/warrityapi.git
   cd warrityapi
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

### Building for Production

```bash
npm run build
npm start
# or
yarn build
yarn start
```

## API Documentation

The API documentation is available at `/api-docs` when running the server. It provides detailed information about all available endpoints, request/response formats, and authentication requirements.

## Project Structure

```
warrityapi/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Custom middleware
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   └── server.js       # Application entry point
├── scripts/            # Utility scripts
├── tests/              # Test files
├── .env.example        # Example environment variables
├── package.json        # Project dependencies
└── README.md           # Project documentation
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Future Development Plans

### Upcoming Features

- **Rate Limiting**: Implement rate limiting for API endpoints
- **Caching**: Add Redis caching for improved performance
- **WebSocket Support**: Real-time notifications and updates
- **Enhanced Security**: Additional security measures and validations
- **API Versioning**: Support for multiple API versions
- **Monitoring**: Enhanced logging and monitoring capabilities
- **Testing**: Expanded test coverage and automated testing
- **Documentation**: Improved API documentation and examples

### Long-term Roadmap

- **Microservices Architecture**: Split into smaller, focused services
- **GraphQL Support**: Add GraphQL API alongside REST
- **Event Sourcing**: Implement event sourcing for better audit trails
- **Performance Optimization**: Optimize database queries and caching
- **Enterprise Features**: Add features for enterprise customers

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/)
- [Radix UI](https://www.radix-ui.com/)
