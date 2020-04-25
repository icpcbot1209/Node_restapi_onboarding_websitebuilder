const axios = require('axios');
const Sentry = require('@sentry/node');
const config = require('../../config/feedly');

const feedlyInstance = axios.create({
    baseURL: config.api,
    timeout: 10000,
    headers: {
        Authorization: `OAuth ${config.key}`,
        'Content-Type': 'application/json',
    },
});

const getFeedSubscriptions = async () => feedlyInstance
    .get('/subscriptions')
    .then((response) => response.data)
    .catch((error) => {
        Sentry.captureException(error);
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers);
        } else if (error.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            console.log(error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.log('Error', error.message);
        }
        console.log(error.config);
        return error;
    });

const getFeedContent = async (streamId, count) => feedlyInstance
    .get('/streams/contents', {
        params: {
            streamId: streamId || config.id,
            count: count || 50,
            ranked: 'newest',
            similar: true,
            unreadOnly: true,
        },
    })
    .then((response) => response.data)
    .catch((error) => {
        Sentry.captureException(error);
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers);
        } else if (error.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            console.log(error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.log('Error', error.message);
        }
        console.log(error.config);
        return error;
    });

const getCounts = async () => feedlyInstance
    .get('/markers/counts')
    .then((response) => response.data)
    .catch((error) => {
        Sentry.captureException(error);
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers);
        } else if (error.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            console.log(error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.log('Error', error.message);
        }
        console.log(error.config);
        return error;
    });

/*
        Body Data Format:
        {
          "entryIds": [
            "TSxGHgRh4oAiHxRU9TgPrpYvYVBPjipkmUVSHGYCTY0=_14499073085:c034:d32dab1f",
            "TSxGHgRh4oAiHxRU9TgPrpYvYVBPjipkmUVSHGYCTY0=_1449255d60a:22c3491:9c6d71ab"
          ],
          "type": "entries",
          "action": "markAsRead"
        }
         */
const markItemAsRead = async (entryIds) => feedlyInstance
    .post('/markers', {
        entryIds,
        type: 'entries',
        action: 'markAsRead',
    })
    .then((response) => response.data)
    .catch((error) => {
        Sentry.captureException(error);
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers);
        } else if (error.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            console.log(error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.log('Error', error.message);
        }
        console.log(error.config);
        return error;
    });

module.exports = {
    getFeedSubscriptions,
    getFeedContent,
    getCounts,
    markItemAsRead,
};
