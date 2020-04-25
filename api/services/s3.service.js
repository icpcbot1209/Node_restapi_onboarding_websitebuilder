const AWS = require('aws-sdk');
const path = require('path');
const request = require('request');
const Sentry = require('@sentry/node');
const config = require('../../config');

const s3 = new AWS.S3(config.aws);

const uploadImageToS3 = async (image) => {
    const date = new Date();
    const imagePath = `articles/${date.getFullYear()}/${date.getMonth() + 1}/${date.getTime()}${path.extname(image)}`;

    const prms = new Promise((resolve, reject) => {
        request({
            url: image,
            encoding: null,
        }, (err, res, body) => {
            const objectParams = {
                Bucket: 'jamfeed-pictures',
                ContentType: res.headers['content-type'],
                ContentLength: res.headers['content-length'],
                Key: imagePath,
                Body: body,
            };
            if (err) {
                reject(err);
            }
            resolve(s3.putObject(objectParams).promise());
        });
    });

    const response = await prms.then(() => {
        console.log(`image was saved. Path=${imagePath}`);
        return {
            s3Url: `https://s3.amazonaws.com/jamfeed-pictures/${imagePath}`,
            cdnUrl: `https://d11ss8tb0cracf.cloudfront.net/${imagePath}`,
        };
    }).catch((err) => {
        Sentry.captureException(err);
        console.log('image was not saved!', err);
        return {
            error: err,
        };
    });

    return response;
};

module.exports = {
    uploadImageToS3,
};
