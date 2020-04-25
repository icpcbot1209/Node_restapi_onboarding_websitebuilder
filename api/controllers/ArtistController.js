const pool = require("../../config/database2");
const artistService = require("../services/artist.service");
const s3Service = require("../services/s3.service");
const { getStartingIndex } = require("../utils");
const axios = require("axios").default;
const configs = require("../../config");
const qs = require("qs");
const requestCountry = require("request-country");

const ArtistController = () => {
  const createArtistBySpotify = async (req, res) => {
    const { urlArtistBySpotify } = req.body;

    if (urlArtistBySpotify) {
      const artistSpotifyId = urlArtistBySpotify.replace("https://open.spotify.com/artist/", "").replace("/", "");

      if (artistSpotifyId) {
        try {
          const authResponse = await axios({
            method: "POST",
            url: "https://accounts.spotify.com/api/token",
            headers: {
              Authorization: `Basic ${Buffer.from(`${configs.spotify.clientId}:${configs.spotify.clientSecret}`).toString("base64")}`,
              "Content-Type": "application/x-www-form-urlencoded"
            },
            data: qs.stringify({
              grant_type: "client_credentials"
            })
          });

          const accessToken = authResponse.data.access_token;
          const code = requestCountry(req, "US") || "US";
          // eslint-disable-next-line max-len

          const response = await axios.get(`https://api.spotify.com/v1/artists/${artistSpotifyId}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          });

          let artistSpotify = response.data;

          if (artistSpotify) {
            let artist = { name: artistSpotify.name, pictureurl: "", altnames: "", websiteurl: "", id_spotify: artistSpotify.id, id_songkick: "", festival: "" };
            // Upload Image to S3
            if (artistSpotify.images.length > 0) {
              artist.pictureurl = artistSpotify.images[0].url;
              // const imageUpload = await s3Service.uploadImageToS3(artistSpotify.images[0].url);
              // if (imageUpload && imageUpload.error) {
              //   console.log("Image Upload Error!");
              // }
              // artist.pictureurl = imageUpload.cdnUrl;
            }

            const artistNew = await artistService.addArtistBySpotify(artist);
            if (artistNew) {
              return res.status(200).json({
                artist: artistNew
              });
            } else {
              return res.status(500).json({
                msg: "Error: Unable to add Artist",
                artist
              });
            }
          }
        } catch (e) {
          console.log(e);
          return res.status(400).json({ msg: "Bad Request: Artist Spotify Url not defined" });
        }
      }
    }

    return res.status(400).json({ msg: "Bad Request: Artist Spotify Url not defined" });
  };


  const addWebsiteUrl = async (req, res) => {
    const { artistId, websiteurl } = req.body;
    try{
      await artistService.addWebsiteUrl(artistId, websiteurl);
      return res.status(200).json({
      });
    } catch(e){
      console.log(e);
      return res.status(500).json({
        msg: "Error: Unable to add Artist"
      });
    }
  };

  /**
   * @swagger
   * /artist:
   *   post:
   *     summary: Add new Artist to JamFeed
   *     description: Adds a new Artist to JamFeed
   *     tags:
   *       - artist
   *       - admin
   */
  const createArtist = async (req, res) => {
    const { artist } = req.body;

    if (artist) {
      // Upload Image to S3
      const imageUpload = await s3Service.uploadImageToS3(artist.pictureurl);
      console.log(imageUpload);
      if (imageUpload && imageUpload.error) {
        return res.status(500).json(imageUpload);
      }
      artist.pictureurl = imageUpload.cdnUrl;

      const artistId = await artistService.addArtist(artist);
      if (artistId) {
        res.status(200).json({
          artist: {
            ...artist,
            id: artistId
          }
        });
      }

      return res.status(500).json({
        msg: "Error: Unable to add Artist",
        artist
      });
    }

    return res.status(400).json({ msg: "Bad Request: Artist not defined" });
  };

  /**
   * @swagger
   * /artist:
   *   put:
   *     summary: Updates and Artist
   *     description: Updates an Artist that already exists in JamFeed.
   *     tags:
   *       - artist
   *       - admin
   */
  const updateArtist = async (req, res) => {
    const { artist } = req.body;

    if (artist) {
      // check to see if image needs to be uploaded to JamFeed S3
      if (!artist.pictureurl.includes("d11ss8tb0cracf.cloudfront.net/articles")) {
        // NOT already uploaded to JamFeed S3, upload new image
        const imageUpload = await s3Service.uploadImageToS3(artist.pictureurl);
        console.log(imageUpload);
        if (imageUpload && imageUpload.error) {
          return res.status(500).json(imageUpload);
        }
        artist.pictureurl = imageUpload.cdnUrl;
      }

      try {
        const [results] = await pool.query("UPDATE V2_artists SET `name`=?,`pictureurl`=?,`altnames`=?,`websiteurl`=?,`id_spotify`=?,`id_songkick`=?,`festival`=? WHERE `id` = ?", [artist.name, artist.pictureurl, artist.altnames, artist.websiteurl, artist.id_spotify, artist.id_songkick, artist.festival, artist.id]);
        if (results.affectedRows === 1) {
          return res.status(200).json({ artist });
        }
      } catch (e) {
        // TODO add log statement
        console.log(e);
      }
      return res.status(500).json({
        msg: "Error updating the Artist",
        artist
      });
    }

    return res.status(400).json({ msg: "Bad Request: Artist is required" });
  };

  /**
   * @swagger
   * /artist:
   *   delete:
   *     summary: Delete an Artist
   *     description: Delete an Artist from JamFeed.
   *     tags:
   *       - artist
   *       - admin
   */
  const deleteArtist = async (req, res) => {
    const { artist } = req.body;

    if (artist) {
      try {
        const [results] = await pool.query("DELETE FROM V2_artists WHERE id = ?", [artist.id]);
        console.log(results);
        if (results.affectedRows === 1) {
          return res.status(200).json({ artist });
        }
      } catch (e) {
        // TODO add log statement
        console.log(e);
      }
      return res.status(500).json({
        msg: "Error deleting Artist",
        artist
      });
    }

    return res.status(400).json({ msg: "Bad Request: Artist is required" });
  };

  /**
   * @swagger
   * /artist:
   *   get:
   *     summary: Get an Artist
   *     description: Retrieve an Artist from JamFeed using a unique artist ID
   *     tags:
   *       - artist
   */
  const getArtist = async (req, res) => {
    const { aid } = req.query;

    if (aid) {
      // execute the query
      try {
        const [results] = await pool.query("SELECT * FROM V2_artists WHERE id = ?", [aid]);
        if (results) {
          return res.status(200).json({
            artist: results[0]
          });
        }
      } catch (e) {
        // TODO add log statement
        console.log(e);
      }
      return res.status(500).json({
        msg: `Error getting Artist aid=${aid}`
      });
    }

    return res.status(400).json({ msg: "Bad Request: Artist ID is required" });
  };

  const searchByName = async (req, res, isOpenSearch) => {
    const { search, term, page = 1, pageSize = 100, sort = "exact" } = req.query;

    let queryTerm = search;
    if (search !== undefined || term !== undefined) {
      // ensure that sort is valid type
      if (!["exact", "popularity"].includes(sort)) {
        res.status(400).json({ msg: `Bad Request: Sort must be on of ${["exact", "popularity"]}` });
      }

      // if search is empty, use term
      if (!queryTerm) {
        queryTerm = term;
      }

      const sortByNameMatchQuery = `SELECT ${isOpenSearch ? "id, name, pictureurl" : "*"} FROM V2_artists WHERE name LIKE ? OR name LIKE ? ORDER BY (name = ?) DESC, length(name) ASC LIMIT ?,?`;
      const sortByPopularityQuery = `SELECT ${isOpenSearch ? "id, name, pictureurl" : "*"} FROM V2_artists WHERE name LIKE ? OR name LIKE ? ORDER BY popularity DESC, (name = ?) DESC LIMIT ?,?`;
      let query = sortByNameMatchQuery;
      let queryParams = [`%${queryTerm}%`, `%${queryTerm.toLowerCase()}%`, queryTerm, parseInt(getStartingIndex(page, pageSize), 10), parseInt(pageSize, 10)];
      if (sort === "popularity") {
        query = sortByPopularityQuery;
        queryParams = [`%${queryTerm}%`, `%${queryTerm.toLowerCase()}%`, queryTerm, parseInt(getStartingIndex(page, pageSize), 10), parseInt(pageSize, 10)];
      }

      // Execute Query
      const [results] = await pool.query(query, queryParams);
      if (results) {
        return res.status(200).json({
          pagination: {
            size: results.length,
            page,
            pageSize
          },
          results
        });
      }

      return res.status(500).json({ msg: `Error getting Artists for query=${search}` });
    }

    return res.status(400).json({ msg: "Bad Request: search or term parameter is required" });
  };

  /**
   * @swagger
   * /artist/searchByName:
   *   get:
   *     summary: Search for Artists
   *     description: Search JamFeed for Artists based on a search term
   *     tags:
   *       - artist
   */
  const closedSearchByName = async (req, res) => {
    searchByName(req, res);
  };

  /**
   * @swagger
   * /artist/publicSearchByName:
   *   get:
   *     summary: Open Search for Artists
   *     description: Open Search JamFeed for Artists based on a search term
   *     tags:
   *       - artist
   */
  const openSearchByName = async (req, res) => {
    searchByName(req, res, true);
  };

  /**
   * @swagger
   * /artist/follow:
   *   post:
   *     summary: Follow an Artist
   *     description: Enables a User to Follow an Artist
   *     tags:
   *       - artist
   *       - admin
   */
  const follow = async (req, res) => {
    const {
      body: { artistId, isFestival },
      user: { user }
    } = req;

    if (artistId && isFestival !== undefined) {
      if (await artistService.followArtist(user.id, artistId, isFestival)) {
        return res.status(200).json(req.body);
      }
      return res.status(500).json(req.body);
    }

    return res.status(400).json({ msg: "Bad Request: artistId and isFestival are required", ...req.body });
  };

  /**
   * @swagger
   * /artist/unfollow:
   *   post:
   *     summary: Unfollow an Artist
   *     description: Enables a User to Unfollow an Artist
   *     tags:
   *       - artist
   *       - admin
   */
  const unfollow = async (req, res) => {
    const {
      body: { artistId, isFestival },
      user: { user }
    } = req;

    if (artistId && isFestival !== undefined) {
      if (await artistService.unfollowArtist(user.id, artistId, isFestival)) {
        return res.status(200).json(req.body);
      }
      return res.status(500).json(req.body);
    }

    return res.status(400).json({ msg: "Bad Request: artistId and isFestival are required", ...req.body });
  };

  /**
   * @swagger
   * /artist/following:
   *   get:
   *     summary: Get Followed Artists
   *     description: Returns Artists followed by authenticated User and returns them in the favorite order set by the User.
   *     tags:
   *       - artist
   */
  const getFollowingFavoriteOrder = async (req, res) => {
    const {
      user: { user }
    } = req;
    const { page, pageSize } = req.query;

    try {
      const results = await artistService.getFollowingFavoriteOrder(user.id, page, pageSize);
      return res.status(200).json({
        results
      });
    } catch (e) {
      return res.status(500).json({
        msg: "Unable to get following",
        results: []
      });
    }
  };

  /**
   * @swagger
   * /artist/followingIds:
   *   get:
   *     summary: Get Followed Artist IDs
   *     description: Returns a simpel list of Artist IDs for Artists the User is following.
   *     tags:
   *       - artist
   *       - admin
   */
  const getFollowingIds = async (req, res) => {
    const {
      user: { user }
    } = req;

    try {
      const results = await artistService.getFollowingIds(user.id);
      const resultIds = results.map(v => v.artistid);
      return res.status(200).json({
        results: resultIds
      });
    } catch (e) {
      return res.status(500).json({
        msg: "Unable to get following ids",
        results: []
      });
    }
  };

  return {
    createArtistBySpotify,
    addWebsiteUrl,
    createArtist,
    updateArtist,
    deleteArtist,
    getArtist,
    closedSearchByName,
    openSearchByName,
    follow,
    unfollow,
    getFollowingFavoriteOrder,
    getFollowingIds
  };
};

module.exports = ArtistController;
