const Sentry = require('@sentry/node');
const pool = require('../../config/database2');
const { getStartingIndex } = require('../utils');

const addArtistBySpotify = async (artist) => {
    try {
        let [results] = await pool.query('SELECT * FROM V2_artists WHERE id_spotify = ?',
            [
                artist.id_spotify,
            ]);
        if (results.length > 0) {
            return results[0];
        }

        [results] = await pool.query('INSERT INTO V2_artists (`searchid`, `name`, `keywords`, `id_spotify`) VALUES (?,?,?,?)',
            [
                artist.name,
                artist.name,
                artist.name,
                artist.id_spotify,
            ]);
        if (results.affectedRows > 0) {
            [results] = await pool.query('SELECT * FROM V2_artists WHERE id_spotify = ?',
                [
                    artist.id_spotify,
                ]);
            return results[0];
        }
    } catch (e) {
        Sentry.captureException(e);
    }
    return false;
};

const addWebsiteUrl = async (artistId, websiteurl) => {
    try{
        console.log(artistId, websiteurl);
        const [results] = await pool.query('UPDATE V2_artists SET websiteurl=? WHERE id=?',
            [
                websiteurl, artistId
            ]);
        console.log(results);
        if(results.length>0){
            return results[0];
        }
    } catch(e) {
        Sentry.captureException(e);
    }
    return false;
}


const addArtist = async (artist) => {
    try {
        const [results] = await pool.query('INSERT INTO V2_artists (`name`,`pictureurl`,`altnames`,`websiteurl`,`id_spotify`,`id_songkick`,`festival`) VALUES (?,?,?,?,?,?,?)',
            [
                artist.name,
                artist.pictureurl,
                artist.altnames,
                artist.websiteurl,
                artist.id_spotify,
                artist.id_songkick,
                artist.festival,
            ]);
        if (results.affectedRows === 1) {
            return results.insertId;
        }
    } catch (e) {
        Sentry.captureException(e);
    }
    return false;
};

const getArtistById = async (artistId) => {
    try {
        const [results] = await pool.query('SELECT * FROM V2_artists WHERE id = ?',
            [
                artistId,
            ]);
        if (results.length === 1) {
            return results[0];
        }
    } catch (e) {
        Sentry.captureException(e);
    }
    return {};
};

const getArtistNews = async (artistId) => {
    try {
        const [results] = await pool.query('SELECT * FROM artistnews WHERE artistid = ? ORDER BY datetime DESC',
            [
                artistId,
            ]);
        return results;
    } catch (e) {
        Sentry.captureException(e);
    }
    return [];
};

const followArtist = async (userId, artistId, isFestival) => {
    try {
        let query = 'INSERT INTO jamfan.likesartist(fbid, artistid) VALUES (?,?)';
        if (isFestival) {
            query = 'INSERT INTO jamfan.V2_likesfestival(fbid, artistid) VALUES (?,?)';
        }
        const [results] = await pool.query(query,
            [
                userId,
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

const unfollowArtist = async (userId, artistId, isFestival) => {
    try {
        let query = 'DELETE FROM jamfan.likesartist WHERE fbid = ? AND artistid = ?';
        if (isFestival) {
            query = 'DELETE FROM jamfan.V2_likesfestival WHERE fbid = ? AND artistid = ?';
        }
        const [results] = await pool.query(query,
            [
                userId,
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

const getFollowingFavoriteOrder = async (userId, page, pageSize) => {
    let query = 'SELECT jamfan.V2_artists.id as artistid, jamfan.V2_artists.name as name, jamfan.V2_artists.pictureurl as pictureurl, jamfan.V2_artists.festival as festival, jamfan.V2_artists.websiteurl as websiteurl, MIN(IFNULL(followerIds.position,9999)) as position, jamfan.V2_artists.id_spotify, jamfan.V2_artists.id_songkick FROM (SELECT jamfan.V3_UserFavoriteArtistOrder.position,jamfan.V3_UserFavoriteArtistOrder.artist_id as artistid FROM jamfan.V3_UserFavoriteArtistOrder WHERE jamfan.V3_UserFavoriteArtistOrder.user_id = ? UNION SELECT null, artistid FROM jamfan.V2_likesfestival WHERE fbid = ? UNION SELECT null, artistid FROM jamfan.likesartist WHERE fbid = ?) as followerIds LEFT JOIN jamfan.V2_artists ON followerIds.artistid = jamfan.V2_artists.id WHERE artistid IS NOT NULL GROUP BY artistid ORDER BY position ASC, name ASC';
    let params = [userId, userId, userId];
    if (page && pageSize) {
        query = 'SELECT jamfan.V2_artists.id as artistid, jamfan.V2_artists.name as name, jamfan.V2_artists.pictureurl as pictureurl, jamfan.V2_artists.festival as festival, jamfan.V2_artists.websiteurl as websiteurl, MIN(IFNULL(followerIds.position,9999)) as position, jamfan.V2_artists.id_spotify, jamfan.V2_artists.id_songkick FROM (SELECT jamfan.V3_UserFavoriteArtistOrder.position,jamfan.V3_UserFavoriteArtistOrder.artist_id as artistid FROM jamfan.V3_UserFavoriteArtistOrder WHERE jamfan.V3_UserFavoriteArtistOrder.user_id = ? UNION SELECT null, artistid FROM jamfan.V2_likesfestival WHERE fbid = ? UNION SELECT null, artistid FROM jamfan.likesartist WHERE fbid = ?) as followerIds LEFT JOIN jamfan.V2_artists ON followerIds.artistid = jamfan.V2_artists.id WHERE artistid IS NOT NULL GROUP BY artistid ORDER BY position ASC, name ASC LIMIT ?,?';
        params = [userId, userId, userId, getStartingIndex(page, pageSize), pageSize];
    }

    try {
        const [results] = await pool.query(query, params);
        return results;
    } catch (e) {
        console.log(e);
        Sentry.captureException(e);
    }
    return [];
};

const getFollowingIds = async (userId) => {
    try {
        const [results] = await pool.query('SELECT artistid FROM jamfan.V2_likesfestival WHERE fbid = ? UNION SELECT artistid FROM jamfan.likesartist WHERE fbid = ?',
            [
                userId,
                userId,
            ]);
        return results;
    } catch (e) {
        console.log(e);
        Sentry.captureException(e);
    }
    return [];
};

module.exports = {
    addArtistBySpotify,
    addWebsiteUrl,
    addArtist,
    getArtistById,
    getArtistNews,
    followArtist,
    unfollowArtist,
    getFollowingFavoriteOrder,
    getFollowingIds,
};
