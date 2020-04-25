module.exports = {
    getStartingIndex: (page, pageSize) => {
        if (page === 1) {
            return 0;
        }
        return ((page - 1) * pageSize);
    },
};
