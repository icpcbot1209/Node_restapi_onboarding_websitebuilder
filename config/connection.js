const development = {
    database: 'jamfan',
    username: 'steveaxelrod007',
    password: 'jamF33dt3sT!',
    host: 'jamfeed-db-test.cixkc8pfuzb6.us-east-1.rds.amazonaws.com',
    dialect: 'mysql',
};

const test = {
    database: process.env.DB_DATABASE,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PW,
    host: process.env.DB_HOST,
    dialect: 'mysql',
};

const production = {
    database: process.env.DB_DATABASE,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PW,
    host: process.env.DB_HOST,
    dialect: 'mysql',
};

module.exports = {
    development,
    test,
    production,
};
