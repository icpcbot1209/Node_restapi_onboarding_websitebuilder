const forEach = require('lodash.foreach');
const get = require('lodash.get');
const groupBy = require('lodash.groupby');
const mergeByKey = require('array-merge-by-key');
const pool = require('../../config/database2');
const feedlyService = require('../services/feedly.service');

const ArticleFeedController = () => {
    /**
     * @swagger
     * /article/cacheSubscriptions:
     *   get:
     *     summary: Get Feedly source feeds and cache in JamFeed DB
     *     description: Get Feedly Source Subscriptions and their counts, group by Category and cache in DB.
     *     tags:
     *       - article
     *       - feedly
     */
    const cacheArticleSubscriptions = async (req, res) => {
        // Get Subscriptions to Cache
        const subscriptionsResponse = await feedlyService.getFeedSubscriptions();
        // Get Subscrption Unread Counts
        const countResponse = await feedlyService.getCounts();
        // Merge Counts and Subscriptions
        const subscrptionAndCounts = mergeByKey('id', subscriptionsResponse, countResponse.unreadcounts);
        // Group all Susbscriptions by Category
        const groupedByCategory = groupBy(subscrptionAndCounts, (item) => get(item, 'categories[0].id', 'none'));

        // Async insert all of the categories
        // Don't worry about failures
        forEach(groupedByCategory, (category, key) => {
            try {
                pool.query('INSERT INTO feedly_categories (category_id,category_json) VALUES (?,?)',
                    [
                        `${key}`,
                        JSON.stringify(category),
                    ]);
            } catch (error) {
                console.log(error);
            }
        });

        return res.status(200).json({ cachingInProgress: true, categoriesToCache: groupedByCategory });
    };

    /**
     * @swagger
     * /article/cacheFeed:
     *   get:
     *     summary: Get Feedly Articles and Cache in JamFeed DB
     *     description: Get Feedly Articles from the Feedly API, cache specific article content in the database.
     *     tags:
     *       - article
     *       - feedly
     */
    const cacheArticleFeed = async (req, res) => {
        // Get Feedly articles to cache
        const response = await feedlyService.getFeedContent();

        // Async insert all of the articles
        // Don't worry about failures
        response.items.forEach((article) => {
            try {
                pool.query('INSERT INTO feedly_articles_all (id,fingerprint,articleJson,isRead,articlePublished,category,stream) VALUES (?,?,?,?,?,?,?)',
                    [
                        article.id,
                        article.fingerprint,
                        JSON.stringify(article),
                        !article.unread,
                        article.published,
                        get(article, 'categories[0].id', ''),
                        get(article, 'origin.streamId', ''),
                    ]);
            } catch (error) {
                console.log(error);
            }
        });

        return res.status(200).json({ cachingInProgress: true, articlesToCache: response.items });
    };

    /**
     * @swagger
     * /article/markArticle:
     *   post:
     *     summary: Mark a cached Feedly article as Read or Unread
     *     description: Mark a cached Feedly article as Read or Unread for future use in cleaning up cached articles in the DB.
     *     tags:
     *       - article
     *       - feedly
     *       - admin
     */
    const markArticle = async (req, res) => {
        const { article } = req.body;
        const [results] = await pool.query('UPDATE feedly_articles_all SET isRead=? WHERE id=?',
            [
                article.isRead,
                article.id,
            ]);

        const response = { ...article, updated: results.affectedRows === 1 };

        return res.status(200).json({ article: response });
    };

    /**
     * @swagger
     * /article/processArticles:
     *   get:
     *     summary: Clean-up cached Feedly articles
     *     description: Clean-up cached Feedly articles that are marked as read OR are older than 5 days
     *     tags:
     *       - article
     *       - feedly
     */
    const processArticles = async (req, res) => {
        // Get Date 5 days ago
        const fiveDaysBack = new Date();
        fiveDaysBack.setDate(fiveDaysBack.getDate() - 5);

        const [results2] = await pool.query('DELETE FROM feedly_articles_all WHERE isRead=? OR articlePublished < ?',
            [
                true,
                fiveDaysBack.getTime(),
            ]);

        return res.status(200).json({ articlesProcessed: results2.affectedRows });
    };

    /**
     * @swagger
     * /article:
     *   get:
     *     summary: Get a list of cached Feedly articles.
     *     description: Returns a list of cached feedly articles for a specific Feedly source subscription, category, or read status.
     *     tags:
     *       - article
     *       - feedly
     *       - admin
     */
    const getCachedArticles = async (req, res) => {
        const { id } = req.query;
        let query = 'SELECT articleJson as article,isRead,articlePublished FROM jamfan.feedly_articles_all WHERE isRead=? ORDER BY articlePublished DESC LIMIT 1000';
        let params = [false];
        if (id) {
            query = 'SELECT articleJson as article,isRead,articlePublished FROM jamfan.feedly_articles_all WHERE (category LIKE ? OR stream=?) AND isRead=? ORDER BY articlePublished DESC LIMIT 1000';
            params = [id, id, false];
        }
        const [results] = await pool.query(query, params);

        forEach(results, (result) => {
            /* eslint no-param-reassign: ["error", { "props": false }] */
            result.article = JSON.parse(result.article);
        });

        return res.status(200).json({ articles: results });
    };

    return {
        cacheArticleSubscriptions,
        cacheArticleFeed,
        markArticle,
        processArticles,
        getCachedArticles,
    };
};

module.exports = ArticleFeedController;
