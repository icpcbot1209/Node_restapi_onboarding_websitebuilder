const NotificationController = () => {
    const search = (req, res) => res.status(200).json({ msg: 'TEST SUCCESS RAWR' });

    return {
        search,
    };
};

module.exports = NotificationController;
