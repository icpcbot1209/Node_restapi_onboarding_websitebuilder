const Sentry = require('@sentry/node');
const axios = require('axios').default;
const os = require('os');
const qs = require('qs');
const { job, start: startJob, stop: stopJob } = require('microjob');
const uuidv5 = require('uuid/v5');
const requestCountry = require('request-country');
const Mailchimp = require('mailchimp-api-v3');
const Stripe = require('stripe');
const pool = require('../../config/database2');
const musicbrainz = require('../services/musicbrainz.service');
const webBuilderService = require('../services/webbuilder.service');
const artistService = require('../services/artist.service');
const configs = require('../../config');

const stripe = Stripe(configs.stripe.secretKey);

const cpuCount = os.cpus().length;

const WebBuilderController = () => {
    /**
     * @swagger
     * /webbuilder:
     *   get:
     *     summary: Get a web builder
     *     description: Retrieve a web builder that has all information about the static website of an artist
     *     tags:
     *       - webbuilder
     */
    const getWebBuilder = async (req, res) => {
        const { user: { user } } = req;
        const { artistId } = req.query;

        try {
            const webBuilder = await webBuilderService.getWebBuilder(user.id, artistId);

            return res.status(200).json(webBuilder);
        } catch (e) {
            return res.status(500).json({
                msg: 'Unable to get the web builder',
            });
        }
    };

    /**
     * @swagger
     * /webbuilder:
     *   get:
     *     summary: Create a web builder
     *     description: Create a web builder
     *     tags:
     *       - webbuilder
     */
    const createWebBuilder = async (req, res) => {
        const { user: { user } } = req;
        const { artistId } = req.body;

        if (artistId) {
            const id = await webBuilderService.createWebBuilder(user.id, artistId);

            if (id) {
                const websiteCoverId = await webBuilderService.createWebsiteCover(id);
                await webBuilderService.updateWebBuilder({
                    id,
                    website_cover_id: websiteCoverId,
                });
                return res.status(200).json({
                    id,
                    website_cover_id: websiteCoverId,
                });
            }

            return res.status(500).json({
                msg: 'Error: Unable to create the web builder',
            });
        }

        return res.status(400).json({ msg: 'Bad Request: artistId not defined' });
    };

    /**
     * @swagger
     * /webbuilder:
     *   get:
     *     summary: Update a web builder
     *     description: Update a web builder
     *     tags:
     *       - webbuilder
     */
    const updateWebBuilder = async (req, res) => {
        const { webBuilder } = req.body;

        if (webBuilder && webBuilder.id) {
            const updated = await webBuilderService.updateWebBuilder(webBuilder);
            if (updated) {
                return res.status(200).json(webBuilder);
            }
            return res.status(500).json(webBuilder);
        }

        return res.status(400).json({ msg: 'Bad Request: Missing the builder id' });
    };

    /**
     * @swagger
     * /artist/socialdata:
     *   get:
     *     summary: Get social data
     *     description: Get social data of the artist
     *     tags:
     *       - artist
     */
    const getSocialData = async (req, res) => {
        const { user: { user } } = req;
        const { webBuilderId } = req.query;

        if (!webBuilderId) return res.status(400).json({ msg: 'Bad request: Missing the builder id' });

        try {
            const webBuilder = await webBuilderService.getWebBuilderById(webBuilderId);
            if (!webBuilder.id) return res.status(400).json({ msg: 'Bad request: The web builder does not exist' });
            if (webBuilder.user_id !== user.id) return res.status(400).json({ msg: 'Bad request: Access denied' });

            const artistId = webBuilder.artist_id;
            const [artists] = await pool.query('SELECT * FROM V2_artists WHERE id = ?', [artistId]);
            const artist = artists[0];

            let dataInMB = {};
            if (artist.mbid) {
                dataInMB = await musicbrainz.getArtistData(artist.mbid);
            }
            const dataInDB = await webBuilderService.getSocialData(webBuilder.id);

            return res.status(200).json({
                dataInMB,
                dataInDB,
            });
        } catch (e) {
            Sentry.captureException(e);
            return res.status(500).json({
                msg: 'Unable to get the social data',
                results: [],
            });
        }
    };

    /**
     * @swagger
     * /artist/socialdata:
     *   post:
     *     summary: Add social data
     *     description: Add a social link of the artist to the database.
     *     tags:
     *       - artist
     */
    const addSocialDatum = async (req, res) => {
        const { user: { user } } = req;
        const { webBuilderId, type, url } = req.body;

        if (webBuilderId && type) {
            try {
                const webBuilder = await webBuilderService.getWebBuilderById(webBuilderId);
                if (!webBuilder.id) return res.status(400).json({ msg: 'Bad request: The web builder does not exist' });
                if (webBuilder.user_id !== user.id) return res.status(400).json({ msg: 'Bad request: Access denied' });

                const id = await webBuilderService.addSocialDatum(webBuilderId, type, url);
                if (id) {
                    return res.status(200).json({
                        id,
                        webbuilder_id: webBuilderId,
                        type,
                        url,
                    });
                }

                return res.status(500).json({
                    msg: 'Error: Unable to add the social datum',
                });
            } catch (e) {
                Sentry.captureException(e);
                return res.status(500).json({
                    msg: 'Error: Unable to add the social datum',
                });
            }
        }

        return res.status(400).json({ msg: 'Bad Request: Missing the required params' });
    };

    /**
     * @swagger
     * /artist/socialdata:
     *   put:
     *     summary: Update social data
     *     description: Update a social link of the artist to the database.
     *     tags:
     *       - artist
     */
    const updateSocialDatum = async (req, res) => {
        const { user: { user } } = req;
        const { datum } = req.body;
        const { webbuilder_id: webBuilderId } = datum;

        if (!webBuilderId) return res.status(400).json({ msg: 'Bad request: Missing the builder id' });

        try {
            const webBuilder = await webBuilderService.getWebBuilderById(webBuilderId);
            if (!webBuilder.id) return res.status(400).json({ msg: 'Bad request: The web builder does not exist' });
            if (webBuilder.user_id !== user.id) return res.status(400).json({ msg: 'Bad request: Access denied' });
        } catch (e) {
            Sentry.captureException(e);
            return res.status(500).json({
                msg: 'Error: Unable to update the social datum',
            });
        }

        if (datum && datum.id) {
            const updated = await webBuilderService.updateSocialDatum(datum);
            if (updated) {
                return res.status(200).json(datum);
            }
            return res.status(500).json(datum);
        }

        return res.status(400).json({ msg: 'Bad Request' });
    };

    /**
     * @swagger
     * /webbuilder/websiteCover:
     *   get:
     *     summary: Get the website cover
     *     description: Get the website cover
     *     tags:
     *       - webbuilder
     */
    const getWebsiteCover = async (req, res) => {
        const { user: { user } } = req;
        const { webBuilderId } = req.query;

        if (webBuilderId) {
            let webBuilder = null;
            try {
                webBuilder = await webBuilderService.getWebBuilderById(webBuilderId);
                if (!webBuilder.id) return res.status(400).json({ msg: 'Bad request: The web builder does not exist' });
                if (webBuilder.user_id !== user.id) return res.status(400).json({ msg: 'Bad request: Access denied' });
            } catch (e) {
                Sentry.captureException(e);
                return res.status(500).json({
                    msg: 'Error: Unable to get the website cover',
                });
            }

            try {
                const websiteCover = await webBuilderService.getWebsiteCover(webBuilder.website_cover_id);
                return res.status(200).json(websiteCover);
            } catch (e) {
                Sentry.captureException(e);
                return res.status(500).json({
                    msg: 'Error: Unable to get the website cover',
                });
            }
        }

        return res.status(400).json({ msg: 'Bad Request: Missing the builder id' });
    };

    /**
     * @swagger
     * /webbuilder:
     *   get:
     *     summary: Update a web builder
     *     description: Update a web builder
     *     tags:
     *       - webbuilder
     */
    const updateWebsiteCover = async (req, res) => {
        const { user: { user } } = req;
        const { websiteCover } = req.body;

        if (websiteCover && websiteCover.id) {
            let webBuilder = null;
            try {
                webBuilder = await webBuilderService.getWebBuilderById(websiteCover.webbuilder_id);
                if (!webBuilder.id) return res.status(400).json({ msg: 'Bad request: The web builder does not exist' });
                if (webBuilder.user_id !== user.id) return res.status(400).json({ msg: 'Bad request: Access denied' });
            } catch (e) {
                Sentry.captureException(e);
                return res.status(500).json({
                    msg: 'Error: Unable to get the website cover',
                });
            }

            const updated = await webBuilderService.updateWebsiteCover(websiteCover);
            if (updated) {
                return res.status(200).json(websiteCover);
            }
            return res.status(500).json(websiteCover);
        }

        return res.status(400).json({ msg: 'Bad Request: Missing id' });
    };

    /**
     * @swagger
     * /webbuilder/generate:
     *   post:
     *     summary: Generate the website for an artist
     *     description: Generate the website for an artist
     *     tags:
     *       - webbuilder
     */
    const generateWebsite = async (req, res) => {
        const { user: { user } } = req;
        const { webBuilderId } = req.body;

        if (!webBuilderId) return res.status(400).json({ msg: 'Bad Request: Missing the builder id' });
        const webBuilder = await webBuilderService.getWebBuilderById(webBuilderId);
        if (!webBuilder.id) return res.status(400).json({ msg: 'Bad Request: The builder does not exist' });
        if (webBuilder.user_id !== user.id) return res.status(400).json({ msg: 'Bad Request: Invalid builder id' });

        if (webBuilder.state === 'IN_PROGRESS') {
            return res.status(200).json({
                code: 'build-in-progress',
            });
        }

        const artist = await artistService.getArtistById(webBuilder.artist_id);
        const [results] = await pool.query('SELECT * FROM V2_WebTemplates WHERE id = ?', [webBuilder.template_id]);
        if (results.length === 0) {
            return res.status(400).json({ msg: 'Bad Request: Missing template' });
        }
        const [webTemplate] = results;

        webBuilder.artist = artist;
        webBuilder.template = webTemplate;
        webBuilder.subdomain = artist.name.toLowerCase().replace(/[^0-9a-zA-Z]/g, '');
        if (process.env.NODE_ENV !== 'production') {
            webBuilder.subdomain = `${webBuilder.subdomain}-test`;
        }
        webBuilder.pub_key = uuidv5(`${webBuilder.subdomain}.jamfeed.com`, uuidv5.DNS);
        webBuilder.state = 'IN_PROGRESS';

        await webBuilderService.updateWebBuilder(webBuilder);

        (async () => {
            try {
                await startJob({ maxWorkers: cpuCount });

                await job(
                    async () => {
                        // eslint-disable-next-line no-undef
                        await generate(webBuilder, configs);
                    },
                    {
                        ctx: {
                            generate: webBuilderService.generateWebsite,
                            webBuilder,
                            configs,
                        },
                    },
                );
            } catch (e) {
                Sentry.captureException(e);
            } finally {
                await stopJob();
            }
        })();

        return res.status(200).json({
            code: 'build-started',
        });
    };

    const pipelineWebhook = async (req, res) => {
        const { commit_status: commitStatus } = req.body;

        if (commitStatus.state === 'SUCCESSFUL') {
            await webBuilderService.distributeWebsite(commitStatus.refname);
            return res.status(200);
        } if (commitStatus.state === 'FAILED') {
            const subdomain = commitStatus.refname;
            const [results] = await pool.query('SELECT * FROM V2_WebBuilder WHERE subdomain = ?', [subdomain]);
            const webBuilder = results[0];
            webBuilder.state = 'FAILURE';
            await webBuilderService.updateWebBuilder(webBuilder);
        }
        return res.status(200);
    };

    /**
     * @swagger
     * /webbuilder/joinEmailList:
     *   get:
     *     summary: Join E-list
     *     description: Join E-list
     *     tags:
     *       - webbuilder
     */
    const joinEmailList = async (req, res) => {
        const { builderId, pubKey, email } = req.query;

        if (!builderId) return res.status(400).json({ msg: 'Bad Request: Missing the builder id' });
        if (!pubKey) return res.status(400).json({ msg: 'Bad Request: Access Denied' });

        const webBuilder = await webBuilderService.getWebBuilderById(builderId);

        if (webBuilder.pub_key === pubKey && webBuilder.mailchimp_audience_id && webBuilder.mailchimp_api_key) {
            const mailchimp = new Mailchimp(webBuilder.mailchimp_api_key);

            try {
                await mailchimp.post(`/lists/${webBuilder.mailchimp_audience_id}/members?skip_merge_validation=true`, {
                    email_address: email,
                    status: 'subscribed',
                });
                return res.status(200).json({
                    msg: 'success',
                });
            } catch (e) {
                Sentry.captureException(e);
                return res.status(500).json({
                    msg: 'Unable to subscribe the email',
                });
            }
        }

        return res.status(400).json({ msg: 'Bad Request: Access Denied' });
    };

    /**
     * @swagger
     * /webbuilder/stripeInfo:
     *   get:
     *     summary: Get subscription plan
     *     description: Get subscription plan
     *     tags:
     *       - webbuilder
     */
    const getSubscriptionPlan = async (req, res) => {
        try {
            const plan = await stripe.plans.retrieve(configs.stripe.subscriptionPlanId);
            res.status(200).json({
                publicKey: configs.stripe.publickKey,
                plan,
            });
        } catch (error) {
            Sentry.captureException(error);
            console.error('get stripe error', error);
            res.status(500).json({
                msg: 'Unable to get the stripe info',
            });
        }
    };

    /**
     * @swagger
     * /webbuilder/coupon:
     *   get:
     *     summary: Get coupon
     *     description: Get coupon
     *     tags:
     *       - webbuilder
     */
    const getCoupon = async (req, res) => {
        try {
            const {
                data: coupons,
            } = await stripe.coupons.list();
            const coupon = coupons.find((c) => c.name === req.query.couponCode);
            if (coupon) {
                res.status(200).json(coupon);
            } else {
                res.status(404).json({
                    msg: 'The coupon does not exist',
                });
            }
        } catch (error) {
            res.status(500).json({
                msg: 'Unable to get the coupon',
            });
        }
    };

    /**
     * @swagger
     * /webbuilder/subscription:
     *   get:
     *     summary: Get subscription
     *     description: Get subscription
     *     tags:
     *       - webbuilder
     */
    const getSubscription = async (req, res) => {
        try {
            const subscription = await stripe.subscriptions.retrieve(req.body.subscriptionId);
            res.status(200).json(subscription);
        } catch (error) {
            Sentry.captureException(error);
            console.error('get subscription error', error);
            res.status(500).json({
                msg: 'Unable to get subscription',
            });
        }
    };

    /**
     * @swagger
     * /webbuilder/subscribe:
     *   post:
     *     summary: Subscribe the premium plan.
     *     description: Subscribe the premium plan.
     *     tags:
     *       - webbuilder
     */
    const subscribe = async (req, res) => {
        const {
            builderId, pubKey, couponId, email, paymentMethod,
        } = req.body;

        if (!builderId) return res.status(400).json({ msg: 'Bad Request: Missing the builder id' });
        if (!pubKey) return res.status(400).json({ msg: 'Bad Request: Access Denied' });

        const webBuilder = await webBuilderService.getWebBuilderById(builderId);

        if (webBuilder.pub_key === pubKey) {
            try {
                const customer = await stripe.customers.create({
                    payment_method: paymentMethod,
                    email,
                    invoice_settings: {
                        default_payment_method: paymentMethod,
                    },
                });
                let coupon;
                if (couponId) {
                    coupon = await stripe.coupons.retrieve(couponId);
                }
                const subscriptionAttrs = {
                    customer: customer.id,
                    items: [{ plan: configs.stripe.subscriptionPlanId }],
                    expand: ['latest_invoice.payment_intent'],
                };
                if (coupon && coupon.valid) {
                    subscriptionAttrs.coupon = coupon.id;
                }
                const subscription = await stripe.subscriptions.create(subscriptionAttrs);

                webBuilder.subscription_status = subscription.status;
                await webBuilderService.updateWebBuilder(webBuilder);

                return res.status(200).json(subscription);
            } catch (e) {
                console.error('sripe subscription session', e);
                return res.status(500);
            }
        }

        return res.status(400).json({ msg: 'Bad Request: Access Denied' });
    };

    /**
     * @swagger
     * /webbuilder/website:
     *   put:
     *     summary: Get the website of an artist
     *     description: Get the website of an artist
     *     tags:
     *       - webbuilder
     */
    const getArtistWebsite = async (req, res) => {
        const { builderId, pubKey } = req.query;

        if (!builderId) return res.status(400).json({ msg: 'Bad Request: Missing the builder id' });
        if (!pubKey) return res.status(400).json({ msg: 'Bad Request: Access Denied' });

        const webBuilder = await webBuilderService.getWebBuilderById(builderId);
        if (webBuilder.pub_key === pubKey) {
            try {
                const artistId = webBuilder.artist_id;
                const artist = await artistService.getArtistById(artistId);

                let socialURLs = {};
                if (artist.mbid) {
                    socialURLs = await musicbrainz.getArtistData(artist.mbid);
                }
                const dataInDB = await webBuilderService.getSocialData(webBuilder.id);
                socialURLs = {
                    ...socialURLs,
                    ...dataInDB.reduce((m, r) => {
                        // eslint-disable-next-line no-param-reassign
                        m[r.type] = r.url;
                        return m;
                    }, {}),
                };

                const artistNews = await artistService.getArtistNews(artistId);

                const websiteCover = await webBuilderService.getWebsiteCover(webBuilder.website_cover_id);

                return res.status(200).json({
                    artist,
                    socialURLs,
                    news: artistNews,
                    websiteCover,
                    adminEmail: webBuilder.email,
                    captureLead: Boolean(webBuilder.mailchimp_api_key && webBuilder.mailchimp_audience_id),
                    subscriptionActive: webBuilder.subscription_status === 'active',
                });
            } catch (e) {
                Sentry.captureException(e);
                return res.status(500).json({
                    msg: 'Unable to get the website',
                });
            }
        }

        return res.status(400).json({ msg: 'Bad Request: Access Denied' });
    };

    /**
     * @swagger
     * /webbuilder/artistMusic:
     *   put:
     *     summary: Get the artist's music on Spotify
     *     description: Get the artist's music on Spotify
     *     tags:
     *       - webbuilder
     */
    const getArtistMusics = async (req, res) => {
        const { builderId, pubKey } = req.query;

        if (!builderId) return res.status(400).json({ msg: 'Bad Request: Missing the builder id' });
        if (!pubKey) return res.status(400).json({ msg: 'Bad Request: Access Denied' });

        const webBuilder = await webBuilderService.getWebBuilderById(builderId);
        if (webBuilder.pub_key === pubKey) {
            try {
                const artistId = webBuilder.artist_id;
                const artist = await artistService.getArtistById(artistId);

                let socialURLs = {};
                if (artist.mbid) {
                    socialURLs = await musicbrainz.getArtistData(artist.mbid);
                }
                const dataInDB = await webBuilderService.getSocialData(webBuilder.id);
                socialURLs = {
                    ...socialURLs,
                    ...dataInDB.reduce((m, r) => {
                        // eslint-disable-next-line no-param-reassign
                        m[r.type] = r.url;
                        return m;
                    }, {}),
                };

                const spotifyUrl = socialURLs['open.spotify.com'] || '';
                const artistSpotifyId = spotifyUrl.replace('https://open.spotify.com/artist/', '').replace('/', '');

                if (artistSpotifyId) {
                    const authResponse = await axios({
                        method: 'POST',
                        url: 'https://accounts.spotify.com/api/token',
                        headers: {
                            Authorization: `Basic ${Buffer.from(`${configs.spotify.clientId}:${configs.spotify.clientSecret}`).toString('base64')}`,
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        data: qs.stringify({
                            grant_type: 'client_credentials',
                        }),
                    });

                    const accessToken = authResponse.data.access_token;
                    const code = requestCountry(req, 'US') || 'US';
                    // eslint-disable-next-line max-len
                    const response = await axios.get(`https://api.spotify.com/v1/artists/${artistSpotifyId}/albums?include_groups=album,single&country=${code}&limit=50`, {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    });

                    return res.status(200).json(response.data);
                }

                return res.status(200).json({ items: [] });
            } catch (e) {
                Sentry.captureException(e);
                return res.status(500).json({
                    msg: 'Unable to get the artist music',
                    items: [],
                });
            }
        }

        return res.status(400).json({ msg: 'Bad Request: Access Denied' });
    };

    return {
        getWebBuilder,
        createWebBuilder,
        updateWebBuilder,
        getSocialData,
        addSocialDatum,
        updateSocialDatum,
        getWebsiteCover,
        updateWebsiteCover,
        generateWebsite,
        pipelineWebhook,
        getArtistWebsite,
        getArtistMusics,
        joinEmailList,
        getSubscription,
        getSubscriptionPlan,
        getCoupon,
        subscribe,
    };
};

module.exports = WebBuilderController;
