const axios = require('axios').default;

const rootAPIurl = 'https://musicbrainz.org/ws/2';
const userAgentValue = 'jamfeed-musicbrainz-api/1.0 (harry@jamfeed.com)';

const SOCIAL_PLATFORMS = [
    'open.spotify.com',
    'facebook.com',
    'itunes.apple.com',
    'twitter.com',
    'youtube.com',
    'instagram.com',
    'soundcloud.com',
    'songkick.com',
    'bandsintown.com',
];

module.exports = {
    getArtistData: (mbid) => new Promise((resolve, reject) => {
        axios.get(`${rootAPIurl}/artist/${mbid}?inc=url-rels&fmt=json`, {
            headers: {
                'User-Agent': userAgentValue,
            },
        }).then((response) => {
            const result = {};
            response.data.relations.forEach((relation) => {
                const platform = SOCIAL_PLATFORMS.find(
                    (p) => relation.url.resource.indexOf(p) !== -1,
                );
                if (platform) {
                    if (result[platform]) {
                        if (relation.url.resource.indexOf('official') !== -1) {
                            result[platform] = relation.url.resource.indexOf('official');
                        }
                    } else {
                        result[platform] = relation.url.resource;
                    }
                }
            });
            resolve(result);
        }).catch(reject);
    }),
};
