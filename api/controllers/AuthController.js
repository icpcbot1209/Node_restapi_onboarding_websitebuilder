const CognitoExpress = require('cognito-express');
const Sentry = require('@sentry/node');
const isEmpty = require('lodash.isempty');

const authService = require('../services/auth.service');
const facebookService = require('../services/facebook.service');
const userService = require('../services/user.service');

// Initializing CognitoExpress constructor
const cognitoExpress = new CognitoExpress({
    region: 'us-east-1',
    cognitoUserPoolId: 'us-east-1_H6pagPxui',
    tokenUse: 'access', // Possible Values: access | id
    tokenExpiration: 3600000, // Up to default expiration of 1 hour (3600000 ms)
});

const AuthController = () => {
    /**
     * Can be used to create a quick JWT token with an email for testing purposes
     */
    const openAuth = async (req, res) => {
        const {
            email,
        } = req.body;

        if (email) {
            // See if user already exists
            let user = await userService.getUserByEmail({ email });

            // If user does not exist create a new one
            if (isEmpty(user)) {
                user = await userService.createUser({ email, fbid: '', fbtoken: '' });
            }

            // If user was not found and could not be created, return error
            if (!user) {
                return res.status(500).json({ msg: 'Error: User could not be created.' });
            }

            // If User was found or created, issue a JWT token
            user = await userService.getUserByEmail({ email });

            const token = authService().issue({ user });
            return res.status(200).json({ token, user });
        }

        return res.status(400).json({ msg: 'Bad Request: Email address is required.' });
    };

    /**
     * @swagger
     * /auth/cognitoAuth:
     *   post:
     *     summary: Authorize a User
     *     description: After Cognito (email/pw) authentication, use this endpoint to authorize a User to access the JamFeed API from different clients.
     *     tags:
     *       - auth
     */
    const cognitoAuth = async (req, res) => {
        const {
            accessToken,
        } = req.body;

        if (accessToken) {
            return cognitoExpress.validate(accessToken, async (err, response) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ msg: 'Error: User could not be authenticated.' });
                }

                try {
                    // Else API has been authenticated. Proceed.
                    const email = response.username;

                    // See if user already exists
                    let user = await userService.getUserByEmail({ email });

                    // If user does not exist create a new one
                    if (isEmpty(user)) {
                        user = await userService.createUser({ email, fbid: '', fbtoken: '' });
                    }

                    // If user was not found and could not be created, return error
                    if (!user) {
                        return res.status(500).json({ msg: 'Error: User could not be created.' });
                    }

                    // If User was found or created, issue a JWT token
                    user = await userService.getUserByEmail({ email });
                    const token = authService().issue({ user });
                    return res.status(200).json({ token, user });
                } catch (error) {
                    Sentry.captureException(error);
                }

                return res.status(500);
            });
        }

        return res.status(400).json({ msg: 'Bad Request: accessToken is required.' });
    };

    /**
     * @swagger
     * /auth/facebookAuth:
     *   post:
     *     summary: Authorize a User
     *     description: After Facebook authentication, use this endpoint to authorize a User to access the JamFeed API from different clients.
     *     tags:
     *       - auth
     */
    const facebookAuth = async (req, res) => {
        const { fbToken } = req.body;

        if (fbToken) {
            const fbResponse = await facebookService.verifyAccessToken(fbToken);

            if (!fbResponse) {
                return res.status(401).json({ msg: 'Unauthorized' });
            }

            const {
                id,
                email,
            } = fbResponse.data;

            // See if user already exists
            let user = await userService.getUserByEmail({ email });

            // If user does not exist create a new one
            if (isEmpty(user)) {
                user = await userService.createUser({ email, fbid: id, fbtoken: fbToken });
            }

            // If user was not found and could not be created, return error
            if (!user) {
                return res.status(500).json({ msg: 'Error: Unable to create user.' });
            }

            // If User was found or created, issue a JWT token
            user = await userService.getUserByEmail({ email });
            const token = authService().issue({ user });
            return res.status(200).json({ token, user });
        }

        return res.status(400).json({ msg: 'Bad Request: Facebook token is required.' });
    };

    /**
     * @swagger
     * /auth/validate:
     *   post:
     *     summary: Validate JWT Token
     *     description: Can be used to check if a JWT token is valid or invalid.
     *     tags:
     *       - auth
     */
    const validate = (req, res) => {
        const { token } = req.body;

        authService().verify(token, (err) => {
            if (err) {
                return res.status(401).json({ isvalid: false, err: 'Invalid Token!' });
            }

            return res.status(200).json({ isvalid: true });
        });
    };

    // Might be old, will clean-up if not needed.
    const verifyCognitoToken = () => {
        console.log('verifyCognitoToken');
        authService().verifyCognitoToken();
    };

    return {
        openAuth,
        cognitoAuth,
        facebookAuth,
        validate,
        verifyCognitoToken,
    };
};

module.exports = AuthController;
