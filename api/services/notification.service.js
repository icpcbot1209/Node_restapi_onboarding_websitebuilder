const { Expo } = require('expo-server-sdk');
const forEach = require('lodash.foreach');

module.exports = {

    sendSMS: () => {
        console.log('Send SMS');
    },

    sendEmail: () => {
        console.log('Send Email');
    },

    sendPush: (pushTokens, pushData) => {
        if (pushTokens !== undefined && pushData !== undefined) {
            const expo = new Expo();

            const messages = [];
            forEach(pushTokens, async (pushToken) => {
                if (!Expo.isExpoPushToken(pushToken)) {
                    console.error(`Push token ${pushToken} is not a valid Expo push token`);
                    return;
                }

                messages.push({
                    to: pushToken,
                    sound: 'default',
                    body: pushData.articleTitle,
                    title: pushData.title,
                    data: {
                        au: pushData.articleUrl,
                        t: pushData.title,
                        b: pushData.articleTitle,
                        aid: pushData.articleId,
                    },
                });
            });

            // The Expo push notification service accepts batches of notifications so
            // that you don't need to send 1000 requests to send 1000 notifications. We
            // recommend you batch your notifications to reduce the number of requests
            // and to compress them (notifications with similar content will get
            // compressed).
            const chunks = expo.chunkPushNotifications(messages);
            const tickets = [];
            (async () => {
                // Send the chunks to the Expo push notification service. There are
                // different strategies you could use. A simple one is to send one chunk at a
                // time, which nicely spreads the load out over time:
                forEach(chunks, async (chunk) => {
                    try {
                        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                        console.log(ticketChunk);
                        tickets.push(...ticketChunk);
                        // NOTE: If a ticket contains an error code in ticket.details.error, you
                        // must handle it appropriately. The error codes are listed in the Expo
                        // documentation:
                        // https://docs.expo.io/versions/latest/guides/push-notifications#response-format
                    } catch (error) {
                        console.error(error);
                    }
                });
            })();
            console.log('Successfully Sent Push Notifications');
            return;
        }

        console.log('Failed to Send Push Notifications');
    },

};
