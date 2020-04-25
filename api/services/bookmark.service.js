const Sentry = require('@sentry/node');
const pool = require('../../config/database2');

const createBookmark = async ({ id }, articleId, artistId) => {
    try {
        const [results] = await pool.query('INSERT INTO V3_UserToArticleBookmarks (`user_id`,`article_id`,`artist_id`) VALUES (?,?,?)',
            [
                id,
                articleId,
                artistId,
            ]);
        if (results.affectedRows === 1) {
            return true;
        }
    } catch (e) {
        Sentry.captureException(e);
    }
    return false;
};

const deleteBookmark = async ({ id }, articleId, artistId) => {
    try {
        const [results] = await pool.query('DELETE FROM V3_UserToArticleBookmarks WHERE user_id = ? AND article_id = ? AND artist_id = ?',
            [
                id,
                articleId,
                artistId,
            ]);
        console.log(results);
        if (results.affectedRows === 1) {
            return true;
        }
    } catch (e) {
        Sentry.captureException(e);
    }
    return false;
};

const getBookmarksForUser = async ({ id }) => {
    try {
        const [results] = await pool.query('SELECT * FROM artistnews WHERE id IN (SELECT article_id FROM V3_UserToArticleBookmarks WHERE user_id = ?) ORDER BY datetime DESC',
            [
                id,
            ]);
        return results;
    } catch (e) {
        Sentry.captureException(e);
    }
    return [];
};

const getBookmarksForUserAndArtist = async ({ id }, artistId) => {
    try {
        const [results] = await pool.query('SELECT * FROM artistnews WHERE id IN (SELECT article_id FROM V3_UserToArticleBookmarks WHERE user_id = ? AND artist_id = ?) ORDER BY datetime DESC',
            [
                id,
                artistId,
            ]);
        return results;
    } catch (e) {
        Sentry.captureException(e);
    }
    return [];
};

module.exports = {
    createBookmark,
    deleteBookmark,
    getBookmarksForUser,
    getBookmarksForUserAndArtist,
};
