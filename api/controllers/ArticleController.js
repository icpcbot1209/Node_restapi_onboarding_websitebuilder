const isEmpty = require('lodash.isempty');
const uniqBy = require('lodash.uniqby');
const Sentry = require('@sentry/node');
const pool = require('../../config/database2');
const s3Service = require('../services/s3.service');
const articleService = require('../services/article.service');
const { getStartingIndex } = require('../utils');

const ArticleController = () => {
    /**
     * @swagger
     * /article:
     *   post:
     *     summary: Create a new Article
     *     description: Admin-only API that creates a new article.
     *     tags:
     *       - article
     *     parameters:
     *       - in: body
     *         name: article
     *         type: object
     *         required: true
     *         properties:
     *           title:
     *              description: Title of articles
     *     responses:
     *       200:
     *         description: List of articles added to JamFeed
     *         schema:
     *           type: object
     *           properties:
     *             articles:
     *               type: array
     *               description: all the articles
     *               items:
     *                 type: object
     */
    const createArticle = async (req, res) => {
        const { article, artistIds } = req.body;

        if (article) {
            console.log(article);
            // Upload Image to S3
            const imageUpload = await s3Service.uploadImageToS3(article.pictureurl);
            console.log(imageUpload);
            if (imageUpload && imageUpload.error) {
                return res.status(500).json(imageUpload);
            }
            article.pictureurl = imageUpload.cdnUrl;

            // Add Articles based on Artists IDs
            const articlesCreated = [];
            const addArticlesFunc = async () => {
                await Promise.all(artistIds.map(async (aid) => {
                    const articleId = await articleService.addArticle(aid, article);
                    if (articleId) {
                        const articleRetrieve = await articleService.getArticleById(articleId);
                        if (!isEmpty(articleRetrieve)) {
                            articlesCreated.push(articleRetrieve);
                        }
                    }
                }));
            };
            await addArticlesFunc();

            return res.status(200).json({
                articles: articlesCreated,
            });
        }
        return res.status(400).json({ msg: 'Bad Request: Article object is required' });
    };

    /**
     * @swagger
     * /article:
     *   put:
     *     summary: Update an Article
     *     description: Admin-only API to update a specific article's attributes.
     *     tags:
     *       - article
     */
    const updateArticle = async (req, res) => {
        const { article } = req.body;

        if (article) {
            // check to see if image needs to be uploaded to JamFeed S3
            if (!article.pictureurl.includes('d11ss8tb0cracf.cloudfront.net/articles')) {
                // NOT already uploaded to JamFeed S3, upload new image
                const imageUpload = await s3Service.uploadImageToS3(article.pictureurl);
                console.log(imageUpload);
                if (imageUpload && imageUpload.error) {
                    return res.status(500).json(imageUpload);
                }
                article.pictureurl = imageUpload.cdnUrl;
            }

            const updated = await articleService.updateArticle(article);
            if (updated) {
                return res.status(200).json({
                    article,
                });
            }
            return res.status(500).json({
                article,
            });
        }

        return res.status(400).json({ msg: 'Bad Request: Article is required' });
    };

    /**
     * @swagger
     * /article:
     *   delete:
     *     summary: Delete an Article
     *     description: Admin-only API that deletes an article.
     *     tags:
     *       - article
     */
    const deleteArticle = async (req, res) => {
        const { article } = req.body;

        if (article && article.id) {
            const deleted = await articleService.deleteArticle(article.id);
            if (deleted) {
                return res.status(200).json({
                    article,
                });
            }
            return res.status(500).json({
                article,
            });
        }

        return res.status(400).json({ msg: 'Bad Request: Article ID is required' });
    };

    /**
     * @swagger
     * /article:
     *   post:
     *     summary: Search for JamFeed Articles
     *     description: Search for an article by title, source or ID.
     *     tags:
     *       - article
     *     parameters:
     *       - in: query
     *         name: article
     *         type: object
     *         required: true
     *         properties:
     *           title:
     *              description: Title of articles
     *     responses:
     *       200:
     *         description: List of articles added to JamFeed
     *         schema:
     *           type: object
     *           properties:
     *             articles:
     *               type: array
     *               description: all the articles
     *               items:
     *                 type: object
     */
    const searchArticle = async (req, res) => {
        const { title, aid, location } = req.query;

        if (title || aid || location) {
            let query = '';
            let queryParams = [];
            if (location) {
                // search based on location (source)
                query = 'SELECT * FROM artistnews WHERE location = ? ORDER BY datetime DESC LIMIT 100';
                queryParams = [location];
            }

            if (aid) {
                // search based on artist ID
                query = 'SELECT * FROM artistnews WHERE artistid = ? ORDER BY datetime DESC LIMIT 100';
                queryParams = [aid];
            }

            if (title) {
                // search based on title
                query = 'SELECT * FROM artistnews WHERE title = ? ORDER BY datetime DESC LIMIT 100';
                queryParams = [title];
            }

            // execute the query
            const articles = await articleService.getArticlesByValue(query, queryParams);
            return res.status(200).json({
                results: articles,
            });
        }

        return res.status(400).json({ msg: 'Bad Request: title, aid, or location is required.' });
    };

    /**
     * @swagger
     * /article:
     *   get:
     *     summary: Get Distinct Articles
     *     description: Admin-only API to retrieve distinct articles.
     *     tags:
     *       - article
     */
    const getAllDistinctArticles = async (req, res) => {
        const { page = 1, pageSize = 100 } = req.query;

        // execute the query
        try {
            const [results] = await pool.query('SELECT * FROM artistnews ORDER BY datetime DESC LIMIT ?,?',
                [
                    parseInt(getStartingIndex(page, pageSize), 10),
                    pageSize,
                ]);
            if (results) {
                const uniqueResults = uniqBy(results, (r) => r.linkurl);
                return res.status(200).json({
                    results: uniqueResults,
                });
            }
        } catch (e) {
            Sentry.captureException(e);
        }
        return res.status(500).json({
            msg: 'Error retrieving articles',
        });
    };

    return {
        createArticle,
        updateArticle,
        deleteArticle,
        searchArticle,
        getAllDistinctArticles,
    };
};

module.exports = ArticleController;
