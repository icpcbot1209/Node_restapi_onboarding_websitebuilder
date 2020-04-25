const GiveawayController = () => {
    const createGiveaway = async (req, res) => {
        const { body, user } = req;
        return res.status(200).json({ body, user });
    };

    const updateGiveaway = async (req, res) => {
        const { body } = req;
        return res.status(200).json({ body });
    };

    const deleteGiveaway = async (req, res) => {
        const { body } = req;
        return res.status(200).json({ body });
    };

    return {
        createGiveaway,
        updateGiveaway,
        deleteGiveaway,
    };
};

module.exports = GiveawayController;
