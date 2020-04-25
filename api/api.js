/*
 * Setup Sentry for Error Reporting
 */
const Sentry = require('@sentry/node');

Sentry.init({ dsn: 'https://77c5783445f34600a7b51b26e4c499d3@sentry.io/1450117' });

/**
 * third party libraries
 */
require('dotenv').config();
const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
// const { ApolloServer } = require('apollo-server-express');
const helmet = require('helmet');
const http = require('http');
const mapRoutes = require('express-routes-mapper');
const expressJwt = require('express-jwt');
const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');

/**
 * server configuration
 */
const config = require('../config/');

// environment: development, testing, production
const environment = process.env.NODE_ENV;
Sentry.configureScope((scope) => {
    scope.setTag('environment', environment);
});

/**
 * Swagger Setup
 */
const swaggerDefinition = {
    info: {
        title: 'JamFeed',
        version: '1.0.0',
        description: 'JamFeed API',
    },
    host: `${config.host}:${config.port}`,
    basePath: '/rest',
};
const options = {
    swaggerDefinition,
    apis: [path.resolve(__dirname, 'controllers/*.js')],
};
const swaggerSpec = swaggerJSDoc(options);

/**
 * express application
 */
const api = express();
const server = http.Server(api);
const mappedRoutes = mapRoutes(config.publicRoutes, 'api/controllers/');
const mappedPrivateRoutes = mapRoutes(config.privateRoutes, 'api/controllers/');
const mappedAdminRoutes = mapRoutes(config.adminRoutes, 'api/controllers/');

// allow cross origin requests
// configure to allow only requests from certain origins
api.use(cors());

// secure express app
api.use(helmet({
    dnsPrefetchControl: false,
    frameguard: false,
    ieNoOpen: false,
}));

// parsing the request bodys
api.use(bodyParser.urlencoded({ extended: false }));
api.use(bodyParser.json());

// public REST API
api.use('/rest', mappedRoutes);
api.use('/rest', expressJwt({ secret: config.jwtSecret }), mappedPrivateRoutes);
api.use('/rest', expressJwt({ secret: config.jwtSecret }), mappedAdminRoutes);

// -- routes for docs and generated swagger spec --

if (process.env.NODE_ENV !== 'production') {
    api.get('/swagger.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    api.get('/docs', (req, res) => {
        res.sendFile(path.join(__dirname, 'swagger.html'));
    });
}

api.use((err, req, res) => {
    if (err.name === 'UnauthorizedError') {
        res.status(401).send({ error: 'Unauthorized' });
    }
});

server.listen(config.port, () => {
    if (environment !== 'production'
        && environment !== 'development'
        && environment !== 'test'
    ) {
        console.error(`NODE_ENV is set to ${environment}, but only production and development are valid.`);
        process.exit(1);
    }
    // return DB;
});
