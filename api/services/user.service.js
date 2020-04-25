const Sentry = require('@sentry/node');
const pool = require('../../config/database2');

const getUserByEmail = async ({ email }) => {
    try {
        const [results] = await pool.query('SELECT * FROM user WHERE email = ?', [email]);
        return results.length > 0 ? results[0] : {};
    } catch (e) {
        Sentry.captureException(e);
    }
    return {};
};

const getUserById = async ({ id }) => {
    try {
        const [results] = await pool.query('SELECT * FROM user WHERE id = ?', [id]);
        return results.length > 0 ? results[0] : {};
    } catch (e) {
        Sentry.captureException(e);
    }
    return {};
};

const createUser = async (user) => {
    try {
        const [results] = await pool.query('INSERT INTO user (`fbid`,`email`,`fbtoken`,`deviceuuid`) VALUES (?,?,?,?)',
            [
                user.fbid,
                user.email,
                user.fbtoken,
                user.deviceuuid,
            ]);
        if (results.affectedRows === 1) {
            return results.insertId;
        }
    } catch (e) {
        Sentry.captureException(e);
    }
    return undefined;
};

const updateUser = async (user) => {
    try {
        const [results] = await pool.query('UPDATE user SET fbid = ?, fbtoken = ?, deviceuuid = ?, expopushtoken = ?, isNew = ? WHERE id = ?',
            [
                user.fbid,
                user.fbtoken,
                user.deviceuuid,
                user.expopushtoken,
                user.isNew,
            ]);
        if (results.affectedRows === 1) {
            return true;
        }
    } catch (e) {
        Sentry.captureException(e);
    }
    return false;
};

const deleteUser = async (user) => {
    try {
        const [results] = await pool.query('DELETE FROM user WHERE id = ?', [user.id]);
        if (results.affectedRows === 1) {
            return true;
        }
    } catch (e) {
        Sentry.captureException(e);
    }
    return false;
};

const searchUser = async (id, email) => {
    try {
        const [results] = pool.query('SELECT * FROM user WHERE id=? OR email=?', [id, email]);
        return results;
    } catch (e) {
        Sentry.captureException(e);
    }
    return {};
};

module.exports = {
    getUserByEmail,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    searchUser,
};
