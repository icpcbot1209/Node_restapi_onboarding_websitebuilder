const privateRoutes = {
    /* Article Routes */
    'GET /article/search': 'ArticleController.searchArticle',
    /* Artist Routes */
    
    'POST /artist/createArtistBySpotify': 'ArtistController.createArtistBySpotify',
    'POST /artist/addWebsiteUrl': 'ArtistController.addWebsiteUrl',
    'GET /artist': 'ArtistController.getArtist',
    'GET /artist/searchByName': 'ArtistController.closedSearchByName',
    'POST /artist/follow': 'ArtistController.follow',
    'POST /artist/unfollow': 'ArtistController.unfollow',
    'GET /artist/following': 'ArtistController.getFollowingFavoriteOrder',
    'GET /artist/followingIds': 'ArtistController.getFollowingIds',
    /* Bookmark Routes */
    'POST /bookmark': 'BookmarkController.addBookmark',
    'DELETE /bookmark': 'BookmarkController.removeBookmark',
    'GET /bookmark': 'BookmarkController.getBookmark',
    /* Follow Routes */
    // 'GET /follow': 'FollowController.getFollows',
    /* Recommendation Routes */
    'GET /recommendation/artist': 'RecommendationController.getRecommendedArtists',
    /* Show Routes */
    'GET /show/artist': 'ShowController.getShowByArtistId',
    'GET /show/location': 'ShowController.getShowByLocation',
    /* Feed Routes */
    'GET /feed': 'FeedController.getFeed',
    /* Web Builder */
    'GET /webbuilder': 'WebBuilderController.getWebBuilder',
    'PUT /webbuilder': 'WebBuilderController.updateWebBuilder',
    'POST /webbuilder': 'WebBuilderController.createWebBuilder',
    'GET /webbuilder/socialdata': 'WebBuilderController.getSocialData',
    'POST /webbuilder/socialdata': 'WebBuilderController.addSocialDatum',
    'PUT /webbuilder/socialdata': 'WebBuilderController.updateSocialDatum',
    'GET /webbuilder/websiteCover': 'WebBuilderController.getWebsiteCover',
    'PUT /webbuilder/websiteCover': 'WebBuilderController.updateWebsiteCover',
    'POST /webbuilder/generate': 'WebBuilderController.generateWebsite',
    /* Website Templates */
    'GET /webTemplates': 'WebsiteTemplateController.getAllTemplates',
};

module.exports = privateRoutes;
