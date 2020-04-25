const Sentry = require('@sentry/node');
const pool = require('../../config/database2');

const addArticle = async (artistId, article) => {
    try {
        const [results] = await pool.query('INSERT INTO `artistnews` (`artistid`,`datetime`,`title`,`linkurl`,`location`,`insertdatetime`,`pictureurl`) VALUES (?,?,?,?,?,?,?)',
            [
                artistId,
                article.datetime,
                article.title,
                article.linkurl,
                article.location,
                article.insertdatetime,
                article.pictureurl,
            ]);
        if (results.affectedRows === 1) {
            return results.insertId;
        }
    } catch (e) {
        Sentry.captureException(e);
    }
    return undefined;
};

const updateArticle = async (article) => {
    try {
        const [results] = await pool.query('UPDATE artistnews SET title=?, linkurl=?, location=?, datetime=?, pictureurl=? WHERE id=?',
            [
                article.title,
                article.linkurl,
                article.location,
                article.datetime,
                article.pictureurl,
                article.id,
            ]);
        if (results.affectedRows === 1) {
            return true;
        }
    } catch (e) {
        Sentry.captureException(e);
    }
    return false;
};

const deleteArticle = async (articleId) => {
    try {
        const [results] = await pool.query('DELETE FROM jamfan.artistnews WHERE id=?',
            [
                articleId,
            ]);
        if (results.affectedRows === 1) {
            return true;
        }
    } catch (e) {
        Sentry.captureException(e);
    }
    return false;
};

const getArticleById = async (articleId) => {
    try {
        const [results] = await pool.query('SELECT * FROM artistnews WHERE id = ?',
            [
                articleId,
            ]);
        if (results.length) {
            return results[0];
        }
    } catch (e) {
        Sentry.captureException(e);
    }
    return {};
};

const getArticlesByValue = async (query, queryParams) => {
    try {
        const [results] = await pool.query(query, queryParams);
        return results;
    } catch (e) {
        Sentry.captureException(e);
    }
    return [];
};

module.exports = {
    addArticle,
    updateArticle,
    deleteArticle,
    getArticleById,
    getArticlesByValue,
};
