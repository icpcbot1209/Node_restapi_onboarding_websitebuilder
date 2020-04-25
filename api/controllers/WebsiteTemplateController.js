const Sentry = require('@sentry/node');
const pool = require('../../config/database2');

const WebsiteTemplateController = () => {
    /**
     * @swagger
     * /webTemplates:
     *   get:
     *     summary: Get all web templates
     *     description: Get all web templates
     *     tags:
     *       - webTemplates
     */
    const getAllTemplates = async (req, res) => {
        try {
            const [results] = await pool.query('SELECT * FROM V2_WebTemplates');
            return res.status(200).json(results);
        } catch (e) {
            Sentry.captureException(e);
        }

        return [];
    };

    return {
        getAllTemplates,
    };
};

module.exports = WebsiteTemplateController;
