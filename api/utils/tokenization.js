module.exports = {
    getCombinations: (str) => {
        // str = 'Privaledge Drops Unreleased Nipsey Hussle Collab "So Cold"';
        const sArray = str.split(' ');
        const n = sArray.length;
        const combos = [];
        for (let i = 0; i < n; i += 1) {
            for (let j = 0; j <= i; j += 1) {
                combos.push(sArray.slice(j, n - i + j).join(' '));
            }
        }
        return combos;
    },
};
