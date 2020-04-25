const mysql = require('mysql2');

const connection = require('./connection');

let pool;

switch (process.env.NODE_ENV) {
case 'production':
    pool = mysql.createPool({
        host: connection.production.host,
        user: connection.production.username,
        database: connection.production.database,
        password: connection.production.password,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    });
    break;
case 'test':
    pool = mysql.createPool({
        host: connection.test.host,
        user: connection.test.username,
        database: connection.test.database,
        password: connection.test.password,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    });
    break;
default:
    pool = mysql.createPool({
        host: connection.development.host,
        user: connection.development.username,
        database: connection.development.database,
        password: connection.development.password,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    });
}

module.exports = pool.promise();
