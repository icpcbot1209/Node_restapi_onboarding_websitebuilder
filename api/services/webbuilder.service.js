const Sentry = require('@sentry/node');
const compact = require('lodash.compact');
const remove = require('lodash.remove');
const AWS = require('aws-sdk');
const dns = require('godaddy-dns');
const pool = require('../../config/database2');
const configs = require('../../config');

const cloudfront = new AWS.CloudFront(configs.aws);
const ses = new AWS.SES({ apiVersion: '2010-12-01', ...configs.aws });

const isNotUndefined = (arg) => typeof arg !== 'undefined';

function createDistribution(bucketName) {
    const params = {
        DistributionConfig: {
            CallerReference: bucketName,
            Comment: `Distribution for ${bucketName}`,
            DefaultCacheBehavior: {
                ForwardedValues: {
                    Cookies: {
                        Forward: 'none',
                    },
                    QueryString: false,
                    Headers: {
                        Quantity: 0,
                        Items: [],
                    },
                    QueryStringCacheKeys: {
                        Quantity: 0,
                        Items: [],
                    },
                },
                MinTTL: 0,
                TargetOriginId: `S3-${bucketName}`,
                TrustedSigners: {
                    Enabled: false,
                    Quantity: 0,
                    Items: [],
                },
                ViewerProtocolPolicy: 'redirect-to-https',
                AllowedMethods: {
                    Items: ['HEAD', 'GET'],
                    Quantity: 2,
                    CachedMethods: {
                        Items: ['GET', 'HEAD'],
                        Quantity: 2,
                    },
                },
                Compress: false,
                DefaultTTL: 86400,
                FieldLevelEncryptionId: '',
                LambdaFunctionAssociations: {
                    Quantity: 0,
                    Items: [],
                },
                MaxTTL: 31536000,
                SmoothStreaming: false,
            },
            Enabled: true,
            Origins: {
                Items: [
                    {
                        DomainName: `${bucketName}.s3.amazonaws.com`,
                        Id: `S3-${bucketName}`,
                        CustomHeaders: {
                            Quantity: 0,
                            Items: [],
                        },
                        OriginPath: '',
                        S3OriginConfig: {
                            OriginAccessIdentity: '',
                        },
                    },
                ],
                Quantity: 1,
            },
            Aliases: {
                Quantity: 1,
                Items: [bucketName],
            },
            CacheBehaviors: {
                Quantity: 0,
                Items: [],
            },
            CustomErrorResponses: {
                Quantity: 1,
                Items: [
                    {
                        ErrorCode: 403,
                        ResponsePagePath: '/index.html',
                        ResponseCode: '200',
                        ErrorCachingMinTTL: 300,
                    },
                ],
            },
            DefaultRootObject: 'index.html',
            HttpVersion: 'http2',
            IsIPV6Enabled: true,
            Logging: {
                Bucket: '',
                Enabled: false,
                IncludeCookies: false,
                Prefix: '',
            },
            OriginGroups: {
                Quantity: 0,
                Items: [],
            },
            PriceClass: 'PriceClass_100',
            Restrictions: {
                GeoRestriction: {
                    Quantity: 0,
                    RestrictionType: 'none',
                    Items: [],
                },
            },
            ViewerCertificate: {
                ACMCertificateArn: configs.sslCertificate,
                Certificate: configs.sslCertificate,
                CertificateSource: 'acm',
                MinimumProtocolVersion: 'TLSv1.1_2016',
                SSLSupportMethod: 'sni-only',
            },
            WebACLId: '',
        },
    };

    return new Promise((resolve, reject) => {
        cloudfront.createDistribution(params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

function createInvalidation(distributionId) {
    const params = {
        DistributionId: distributionId,
        InvalidationBatch: {
            CallerReference: Date.now(),
            Paths: {
                Quantity: 1,
                Items: ['/*'],
            },
        },
    };

    return new Promise((resolve, reject) => {
        cloudfront.createInvalidation(params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

const sendEmail = (to, subject, message) => {
    const params = {
        Destination: {
            ToAddresses: [to],
        },
        Message: {
            Body: {
                Html: {
                    Charset: 'UTF-8',
                    Data: message,
                },
            },
            Subject: {
                Charset: 'UTF-8',
                Data: subject,
            },
        },
        Source: configs.email.source,
    };

    return ses.sendEmail(params).promise();
};

const getWebBuilder = async (userId, artistId) => {
    try {
        const [results] = await pool.query('SELECT * FROM V2_WebBuilder WHERE user_id = ? AND artist_id = ?',
            [
                userId,
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

const getWebBuilderById = async (id) => {
    try {
        const [results] = await pool.query('SELECT * FROM V2_WebBuilder WHERE id = ?',
            [
                id,
            ]);
        if (results.length === 1) {
            return results[0];
        }
    } catch (e) {
        Sentry.captureException(e);
    }

    return {};
};

const createWebBuilder = async (userId, artistId) => {
    try {
        const [results] = await pool.query('INSERT INTO V2_WebBuilder (`user_id`, `artist_id`) VALUES(?,?)', [userId, artistId]);
        if (results.affectedRows === 1) {
            return results.insertId;
        }
    } catch (e) {
        console.log(e);
        Sentry.captureException(e);
    }
    return false;
};

const updateWebBuilder = async (webBuilder) => {
    const {
        id,
        template_id: templateId,
        website_cover_id: websiteCoverId,
        email,
        subdomain,
        sumo_script: sumoScript,
        mailchimp_audience_id: mailchimpAudienceId,
        mailchimp_api_key: mailchimpApiKey,
        pub_key: pubKey,
        distribution_id: distributionId,
        state,
        subscription_status: subscriptionStatus,
    } = webBuilder;

    try {
        const setString = compact([
            isNotUndefined(templateId) ? 'template_id = ?' : '',
            isNotUndefined(websiteCoverId) ? 'website_cover_id = ?' : '',
            isNotUndefined(email) ? 'email = ?' : '',
            isNotUndefined(subdomain) ? 'subdomain = ?' : '',
            isNotUndefined(sumoScript) ? 'sumo_script = ?' : '',
            isNotUndefined(mailchimpAudienceId) ? 'mailchimp_audience_id = ?' : '',
            isNotUndefined(mailchimpApiKey) ? 'mailchimp_api_key = ?' : '',
            isNotUndefined(pubKey) ? 'pub_key = ?' : '',
            isNotUndefined(distributionId) ? 'distribution_id = ?' : '',
            isNotUndefined(state) ? 'state = ?' : '',
            isNotUndefined(subscriptionStatus) ? 'subscription_status = ?' : '',
        ]).join(',');
        const values = remove([
            templateId,
            websiteCoverId,
            email,
            subdomain,
            sumoScript,
            mailchimpAudienceId,
            mailchimpApiKey,
            pubKey,
            distributionId,
            state,
            subscriptionStatus,
            id,
        ], (n) => typeof n !== 'undefined');

        const [results] = await pool.query(`UPDATE V2_WebBuilder SET ${setString} WHERE id = ?`, values);

        if (results.affectedRows === 1) {
            return true;
        }
    } catch (e) {
        console.log(e);
        Sentry.captureException(e);
    }
    return false;
};

const getSocialData = async (webBuilderId) => {
    try {
        const [results] = await pool.query('SELECT * FROM V2_SocialData WHERE webbuilder_id = ?', [webBuilderId]);
        return results;
    } catch (e) {
        console.log(e);
        Sentry.captureException(e);
    }
    return [];
};

const addSocialDatum = async (webBuilderId, type, url) => {
    try {
        const [results] = await pool.query('INSERT INTO V2_SocialData (`webbuilder_id`, `type`, `url`) VALUES(?,?,?)', [webBuilderId, type, url]);
        if (results.affectedRows === 1) {
            return results.insertId;
        }
    } catch (e) {
        console.log(e);
        Sentry.captureException(e);
    }
    return false;
};

const updateSocialDatum = async ({ id, type, url }) => {
    try {
        const [results] = await pool.query('UPDATE V2_SocialData SET type = ?, url = ? WHERE id = ?',
            [
                type,
                url,
                id,
            ]);

        if (results.affectedRows === 1) {
            return true;
        }
    } catch (e) {
        console.log(e);
        Sentry.captureException(e);
    }
    return false;
};

const createWebsiteCover = async (webBuilderId) => {
    try {
        const [results] = await pool.query('INSERT INTO WebsiteCovers (`webbuilder_id`) VALUE (?)', [webBuilderId]);
        if (results.affectedRows === 1) {
            return results.insertId;
        }
    } catch (e) {
        console.log(e);
        Sentry.captureException(e);
    }
    return false;
};

const getWebsiteCover = async (id) => {
    try {
        const [results] = await pool.query('SELECT * FROM WebsiteCovers WHERE id = ?', [id]);
        if (results.length === 1) {
            return results[0];
        }
    } catch (e) {
        console.log(e);
        Sentry.captureException(e);
    }
    return {};
};


const updateWebsiteCover = async (websiteCover) => {
    const {
        id,
        bio,
        general_manager: generalManager,
        booking_agent: bookingAgent,
        press,
        desktop_video_url: desktopVideoUrl,
        artist_bio_photo_url: artistBioPhotoUrl,
        mobile_photo_url: mobilePhotoUrl,
        desktop_photo_url: desktopPhotoUrl,
        home_page_photo_url: homePagePhotoUrl,
        news_page_photo_url: newsPagePhotoUrl,
        tour_page_photo_url: tourPagePhotoUrl,
        music_page_photo_url: musicPagePhotoUrl,
        video_page_photo_url: videoPagePhotoUrl,
        merch_page_photo_url: merchPagePhotoUrl,
        about_page_photo_url: aboutPagePhotoUrl,
        contact_page_photo_url: contactPagePhotoUrl,
        font_family: fontFamily,
        font_type: fontType,
        dark_background_color: darkBackgroundColor,
        light_background_color: lightBackgroundColor,
        dark_foreground_color: darkForegroundColor,
        light_foreground_color: lightForegroundColor,
    } = websiteCover;

    try {
        const setString = compact([
            isNotUndefined(bio) ? 'bio = ?' : '',
            isNotUndefined(generalManager) ? 'general_manager = ?' : '',
            isNotUndefined(bookingAgent) ? 'booking_agent = ?' : '',
            isNotUndefined(press) ? 'press = ?' : '',
            isNotUndefined(desktopVideoUrl) ? 'desktop_video_url = ?' : '',
            isNotUndefined(artistBioPhotoUrl) ? 'artist_bio_photo_url = ?' : '',
            isNotUndefined(mobilePhotoUrl) ? 'mobile_photo_url = ?' : '',
            isNotUndefined(desktopPhotoUrl) ? 'desktop_photo_url = ?' : '',
            isNotUndefined(homePagePhotoUrl) ? 'home_page_photo_url = ?' : '',
            isNotUndefined(newsPagePhotoUrl) ? 'news_page_photo_url = ?' : '',
            isNotUndefined(tourPagePhotoUrl) ? 'tour_page_photo_url = ?' : '',
            isNotUndefined(musicPagePhotoUrl) ? 'music_page_photo_url = ?' : '',
            isNotUndefined(videoPagePhotoUrl) ? 'video_page_photo_url = ?' : '',
            isNotUndefined(merchPagePhotoUrl) ? 'merch_page_photo_url = ?' : '',
            isNotUndefined(aboutPagePhotoUrl) ? 'about_page_photo_url = ?' : '',
            isNotUndefined(contactPagePhotoUrl) ? 'contact_page_photo_url = ?' : '',
            isNotUndefined(fontFamily) ? 'font_family = ?' : '',
            isNotUndefined(fontType) ? 'font_type = ?' : '',
            isNotUndefined(darkBackgroundColor) ? 'dark_background_color = ?' : '',
            isNotUndefined(darkForegroundColor) ? 'dark_foreground_color = ?' : '',
            isNotUndefined(lightBackgroundColor) ? 'light_background_color = ?' : '',
            isNotUndefined(lightForegroundColor) ? 'light_foreground_color = ?' : '',
        ]).join(',');
        const values = remove([
            bio,
            generalManager,
            bookingAgent,
            press,
            desktopVideoUrl,
            artistBioPhotoUrl,
            mobilePhotoUrl,
            desktopPhotoUrl,
            homePagePhotoUrl,
            newsPagePhotoUrl,
            tourPagePhotoUrl,
            musicPagePhotoUrl,
            videoPagePhotoUrl,
            merchPagePhotoUrl,
            aboutPagePhotoUrl,
            contactPagePhotoUrl,
            fontFamily,
            fontType,
            darkBackgroundColor,
            darkForegroundColor,
            lightBackgroundColor,
            lightForegroundColor,
            id,
        ], (n) => typeof n !== 'undefined');
        const [results] = await pool.query(`UPDATE WebsiteCovers SET ${setString} WHERE id = ?`, values);

        if (results.affectedRows === 1) {
            return true;
        }
    } catch (e) {
        console.log(e);
        Sentry.captureException(e);
    }
    return false;
};

const generateWebsite = async (webBuilder, argConfigs) => {
    // eslint-disable-next-line global-require
    const localAWS = require('aws-sdk');
    const s3 = new localAWS.S3(argConfigs);

    // eslint-disable-next-line global-require
    const replaceInFile = require('replace-in-file');

    function checkBucketExist(bucketName) {
        return new Promise((resolve) => {
            const params = {
                Bucket: bucketName,
            };

            s3.headBucket(params, (err) => {
                if (err) {
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }

    function createBucket(bucketName) {
        // Create the parameters for calling createBucket
        const bucketParams = {
            Bucket: bucketName,
        };

        return new Promise((resolve, reject) => {
            s3.createBucket(bucketParams, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data.Location);
                }
            });
        });
    }

    function setBucketPolicy(bucketName) {
        const policy = {
            Version: '2008-10-17',
            Id: 'PolicyForPublicWebsiteContent',
            Statement: [
                {
                    Sid: 'PublicReadGetObject',
                    Effect: 'Allow',
                    Principal: {
                        AWS: '*',
                    },
                    Action: 's3:GetObject',
                    Resource: `arn:aws:s3:::${bucketName}/*`,
                },
            ],
        };
        const params = {
            Bucket: bucketName,
            Policy: JSON.stringify(policy),
        };
        return new Promise((resolve, reject) => {
            s3.putBucketPolicy(params, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    function setBucketStaticHost(bucketName) {
        // Create JSON for putBucketWebsite parameters
        const staticHostParams = {
            Bucket: bucketName,
            WebsiteConfiguration: {
                ErrorDocument: {
                    Key: 'index.html',
                },
                IndexDocument: {
                    Suffix: 'index.html',
                },
            },
        };

        return new Promise((resolve, reject) => {
        // set the new website configuration on the selected bucket
            s3.putBucketWebsite(staticHostParams, (err, data) => {
                if (err) {
                    // display error message
                    reject(err);
                } else {
                    // update the displayed website configuration for the selected bucket
                    resolve(data);
                }
            });
        });
    }

    try {
        // eslint-disable-next-line global-require
        const temp = require('temp');
        temp.track();
        const tempPath = temp.mkdirSync();
        const bucketName = `${webBuilder.subdomain}.jamfeed.com`;

        const bucketExists = await checkBucketExist(bucketName);
        if (!bucketExists) {
            // Create S3 Bucket to host a website files
            await createBucket(bucketName);
            await setBucketPolicy(bucketName);
        }
        await setBucketStaticHost(bucketName);

        // eslint-disable-next-line global-require
        let git = require('simple-git/promise')(tempPath);

        const selectedTemplate = webBuilder.template.repo_name;
        await git.clone(
            // eslint-disable-next-line max-len
            `https://${argConfigs.bitbucket.user}:${argConfigs.bitbucket.appPassword}@bitbucket.org/jamfeed/${selectedTemplate}.git`,
        );

        // eslint-disable-next-line global-require
        git = require('simple-git/promise')(
            `${tempPath}/${selectedTemplate}`,
        );
        git.addConfig('user.name', argConfigs.bitbucket.user);
        git.addConfig('user.email', argConfigs.bitbucket.email);

        await git.checkoutLocalBranch(webBuilder.subdomain);

        await replaceInFile({
            files: `${tempPath}/${selectedTemplate}/bitbucket-pipelines.yml`,
            from: [/%site-cname%/g],
            to: [webBuilder.subdomain],
        });

        await replaceInFile({
            files: `${tempPath}/${selectedTemplate}/.env`,
            from: ['%BUILDER_ID%', '%ARTIST_PUB_KEY%', '%ENV%'],
            to: [webBuilder.id, webBuilder.pub_key, process.env.NODE_ENV || 'test'],
        });

        await replaceInFile({
            files: `${tempPath}/${selectedTemplate}/public/index.html`,
            from: [/%artist-name%/g, /%sumo-script%/g],
            to: [webBuilder.artist.name, webBuilder.sumo_script || ''],
        });

        await git.add(['bitbucket-pipelines.yml', '.env', 'public/index.html']);
        await git.commit(`Template for ${webBuilder.artist.name}`);
        await git
            .silent(true)
            .push(['-u', 'origin', webBuilder.subdomain, '--force']);
    } catch (e) {
        console.log('generate website error', e);
    }
};

const sendConfirmationEmail = (email, bucketName) => {
    // eslint-disable-next-line max-len
    const message = `Congratulations!  Your new website has been generated and hosted on JamFeed at https://${bucketName}. Please note that it may take a few minutes for this new website to connect to all of your content online, so we thank you for your patience.<br /><br />`
    // eslint-disable-next-line max-len
    + `For now you can preview your website by visiting http://${bucketName}.s3-website-us-east-1.amazonaws.com <br /><br />`
    + 'Also, did you know that your new JamFeed website will automatically update your music, videos, news, and tour dates in real-time saving you hours of time each month!?   We hope you enjoy a website that works for you, so you can focus on making great music and sharing it with the world.<br /><br />'
    + 'Thank you!<br />'
    + 'JamFeed Team';

    return sendEmail(
        email,
        'Your new website - powered by JamFeed',
        message,
    );
};

const distributeWebsite = async (subdomain) => {
    const [results] = await pool.query('SELECT * FROM V2_WebBuilder WHERE subdomain = ?', [subdomain]);
    const webBuilder = results[0];
    const bucketName = `${webBuilder.subdomain}.jamfeed.com`;

    try {
        if (!webBuilder.distribution_id) {
            // Create a CloudFront distribution to serve out the S3-hosted website.
            const { Distribution } = await createDistribution(bucketName);

            await dns.updateRecords(Distribution.DomainName, {
                apiKey: configs.godaddy.key,
                secret: configs.godaddy.secret,
                domain: 'jamfeed.com',
                records: [{ type: 'CNAME', name: webBuilder.subdomain }],
            });

            webBuilder.distribution_id = Distribution.Id;
        } else {
            await createInvalidation(webBuilder.distribution_id);
        }

        webBuilder.state = 'SUCCESS';
        await updateWebBuilder(webBuilder);
        await sendConfirmationEmail(webBuilder.email, bucketName);
    } catch (e) {
        Sentry.captureException(e);
    }
};

module.exports = {
    sendEmail,
    sendConfirmationEmail,
    getWebBuilder,
    getWebBuilderById,
    createWebBuilder,
    updateWebBuilder,
    getSocialData,
    addSocialDatum,
    updateSocialDatum,
    createWebsiteCover,
    getWebsiteCover,
    updateWebsiteCover,
    generateWebsite,
    distributeWebsite,
};
