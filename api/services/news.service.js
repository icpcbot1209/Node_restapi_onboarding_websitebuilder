const Sentry = require('@sentry/node');
const pool = require('../../config/database2');
const { getStartingIndex } = require('../utils');

const getUserNews = async ({ id }, page, pageSize) => {
    try {
        const [results] = await pool.query('SELECT * FROM jamfan.artistnews WHERE artistid IN (SELECT artistid FROM jamfan.likesartist WHERE fbid = ? UNION SELECT artistid from jamfan.V2_likesfestival WHERE fbid = ?) ORDER BY datetime DESC LIMIT ?,?',
            [
                id,
                id,
                getStartingIndex(page, pageSize),
                pageSize,
            ]);
        console.log(results);
        return results;
    } catch (e) {
        console.log(e);
        Sentry.captureException(e);
    }
    return [];
};

module.exports = {
    getUserNews,
};
