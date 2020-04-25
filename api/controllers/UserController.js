const isEmpty = require('lodash.isempty');
const userService = require('../services/user.service');

const UserController = () => {
    /**
     * @swagger
     * /user:
     *   post:
     *     summary: Create User
     *     description: Create a new JamFeed User.
     *     tags:
     *       - user
     *       - admin
     */
    const createUser = async (req, res) => {
        const { user } = req.body;

        if (user) {
            // See if user already exists by email
            const newUser = await userService.getUserByEmail(user);

            if (!isEmpty(newUser)) {
                // TODO add log statement
                return res.status(400).json({ msg: 'Bad Request: User already exists' });
            }

            // If user does not exist create a new one
            const newUserId = await userService.createUser(user);

            // If user was not found and could not be created, return error
            if (!newUserId) {
                return res.status(400).json({ msg: 'Bad Request: Unable to create User' });
            }

            return res.status(200).json({
                user: {
                    ...user,
                    id: newUserId,
                },
            });
        }

        return res.status(400).json({ msg: 'Bad Request: Email address is required.' });
    };

    /**
     * @swagger
     * /user:
     *   get:
     *     summary: Get a User
     *     description: Returns a JamFeed User based on a user ID.
     *     tags:
     *       - user
     *       - admin
     */
    const getUser = async (req, res) => {
        const { user } = req.body;

        if (user) {
            const foundUser = await userService.getUserById(user);

            if (isEmpty(foundUser)) {
                return res.status(404).json({ msg: `User with id=${user.id} not found!` });
            }

            return res.status(200).json({ user: foundUser });
        }

        return res.status(400).json({ msg: 'Bad Request: User is required' });
    };

    /**
     * @swagger
     * /user:
     *   put:
     *     summary: Update a User
     *     description: Updates a JamFeed User
     *     tags:
     *       - user
     *       - admin
     */
    const updateUser = async (req, res) => {
        const { user } = req.body;

        if (user) {
            const userUpdated = userService.updateUser(user);

            if (!userUpdated) {
                return res.status(404).json({ msg: `User with id=${user.id} not found!` });
            }

            return res.status(200).json({ user });
        }

        return res.status(400).json({ msg: 'Bad Request: User is required' });
    };

    /**
     * @swagger
     * /user:
     *   delete:
     *     summary: Delete a User
     *     description: Deletes a JamFeed User.
     *     tags:
     *       - user
     *       - admin
     */
    const deleteUser = async (req, res) => {
        const { user } = req.body;

        if (user) {
            const userDeleted = await userService.deleteUser(user);

            if (userDeleted) {
                return res.status(200).json({ user });
            }
            return res.status(500).json({ msg: `Unable to delete User.  User=${user}` });
        }

        return res.status(400).json({ msg: 'Bad Request: User is required' });
    };

    /**
     * @swagger
     * /user/search:
     *   get:
     *     summary: Search for a User
     *     description: Searches for a JamFeed User based in ID or email address.
     *     tags:
     *       - user
     *       - admin
     */
    const search = async (req, res) => {
        const { email, id } = req.query;

        if (email || id) {
            const users = userService.searchUser(id, email);
            return res.status(200).json({ users });
        }

        return res.status(400).json({ msg: 'Bad Request: Email or ID is required' });
    };

    return {
        createUser,
        getUser,
        updateUser,
        deleteUser,
        search,
    };
};

module.exports = UserController;
