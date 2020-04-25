const adminRoutes = {
    /* Article Routes */
    'POST /article': 'ArticleController.createArticle',
    'PUT /article': 'ArticleController.updateArticle',
    'DELETE /article': 'ArticleController.deleteArticle',
    'GET /article/getAllDistinct': 'ArticleController.getAllDistinctArticles',
    /* Article Feed Routes */
    'POST /article/markArticle': 'ArticleFeedController.markArticle',
    'GET /article/getCachedArticles': 'ArticleFeedController.getCachedArticles',
    /* Artist Routes */
    'POST /artist': 'ArtistController.createArtist',
    'PUT /artist': 'ArtistController.updateArtist',
    'DELETE /artist': 'ArtistController.deleteArtist',
    /* Notification Routes */
    'GET /notification/search': 'NotificationController.search',
    /* User Routes */
    'POST /user': 'UserController.createUser',
    'GET /user': 'UserController.getUser',
    'PUT /user': 'UserController.updateUser',
    'DELETE /user': 'UserController.deleteUser',
    'GET /user/search': 'UserController.search',
};

module.exports = adminRoutes;
