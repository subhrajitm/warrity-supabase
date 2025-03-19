const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { name, version, description, author, license } = require('../../package.json');

// Get environment-specific server URL
const getServerUrl = () => {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') {
    return process.env.API_URL || 'https://api.warrity.com';
  } else if (env === 'staging') {
    return process.env.API_URL || 'https://staging-api.warrity.com';
  } else {
    return process.env.API_URL || `http://localhost:${process.env.PORT || 5001}`;
  }
};

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Warrity API Documentation',
      version: version || '1.0.0',
      description: description || 'API documentation for the Warrity Warranty Management System',
      contact: {
        name: author || 'Warrity Support',
        url: 'https://warrity.com/support',
        email: 'support@warrity.com'
      },
      license: {
        name: license || 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: getServerUrl(),
        description: `${process.env.NODE_ENV || 'development'} server`
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  // Path to the API docs
  apis: [
    './src/swagger/*.js',
    './src/routes/*.js',
    './src/models/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Warrity API Documentation',
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha'
    }
  }),
  spec: swaggerSpec
};