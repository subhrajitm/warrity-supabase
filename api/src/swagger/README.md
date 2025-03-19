# Warrity API Documentation

This directory contains the Swagger documentation for the Warrity API. The documentation is organized into separate files for better maintainability and clarity.

## Structure

- **components.js**: Contains schema definitions for all models used in the API, as well as standard response objects.
- **admin.routes.js**: Documentation for admin-specific routes, including user management and dashboard statistics.
- **warranty.routes.js**: Documentation for warranty-related routes, including CRUD operations and document management.
- **user.routes.js**: Documentation for user authentication and profile management.
- **product.routes.js**: Documentation for product management.
- **event.routes.js**: Documentation for event and calendar management.

## Access

The Swagger documentation is automatically loaded by the server and can be accessed at:
```
http://localhost:5001/api-docs/
```

## Features

- **Interactive UI**: Test API endpoints directly from the browser
- **Request Builder**: Automatically formats requests based on schema definitions
- **Response Visualization**: Shows formatted responses for better readability
- **Authentication Support**: Includes JWT token authentication flow

## Type Consistency

The Swagger schemas are designed to match the TypeScript interfaces defined in the `/types` directory, ensuring consistency between the API documentation and the actual data models used in the application.

## Response Examples

Each endpoint includes detailed response examples to help developers understand the expected data format.

## Authentication

Most endpoints require authentication using a JWT token. This is indicated by the `bearerAuth` security requirement in the documentation.

## Common Responses

Standard responses like `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, and `500 Server Error` are defined as reusable components in `components.js` and referenced throughout the documentation.

## Warranties API

The warranties API includes endpoints for managing warranty documents:

- `POST /api/warranties/:id/documents` - Upload warranty documents (up to 5 files)
- `DELETE /api/warranties/:id/documents/:documentId` - Delete a specific warranty document

These endpoints are used by the warranties management interface, which combines both admin and warranty APIs as described in the application's documentation.

## Maintenance

When adding new endpoints or modifying existing ones, please update the corresponding documentation file to ensure that the API documentation remains accurate and up-to-date.

## Troubleshooting

If the Swagger documentation is not accessible at `/api-docs`, ensure:

1. The server is running correctly
2. The Swagger routes are properly registered in `server.js` (they should be defined before the API routes)
3. The Swagger configuration in `config/swagger.js` is correctly set up
