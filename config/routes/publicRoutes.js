const publicRoutes = {
    'POST /auth/openAuth': 'AuthController.openAuth',
    'POST /auth/cognitoAuth': 'AuthController.cognitoAuth',
    'POST /auth/facebookAuth': 'AuthController.facebookAuth',
    'POST /auth/validate': 'AuthController.validate',
    // 'GET /auth/validateCognito': 'AuthController.verifyCognitoToken',
    /* Artist Routes */
    'GET /artist/openSearchByName': 'ArtistController.openSearchByName',
    /* Web Builder */
    'POST /webbuilder/webhook': 'WebBuilderController.pipelineWebhook',
    'GET /webbuilder/website': 'WebBuilderController.getArtistWebsite',
    'GET /webbuilder/artistMusic': 'WebBuilderController.getArtistMusics',
    'GET /webbuilder/joinEmailList': 'WebBuilderController.joinEmailList',
    'GET /webbuilder/subscriptionPlan': 'WebBuilderController.getSubscriptionPlan',
    'GET /webbuilder/coupon': 'WebBuilderController.getCoupon',
    'POST /webbuilder/subscription': 'WebBuilderController.getSubscription',
    'POST /webbuilder/subscribe': 'WebBuilderController.subscribe',
    /* Feedly Routes */
    'GET /article/cacheSubscriptions': 'ArticleFeedController.cacheArticleSubscriptions',
    'GET /article/cacheFeed': 'ArticleFeedController.cacheArticleFeed',
    'GET /article/processArticles': 'ArticleFeedController.processArticles',
};

module.exports = publicRoutes;
