const db = require('./db');

const getAllFood = (callback) => {
    db.all('SELECT * FROM food', [], (err, rows) => {
        callback(err, rows);
    });
};

const getFoodById = (id, callback) => {
    db.get('SELECT * FROM food WHERE id = ?', [id], (err, row) => {
        callback(err, row);
    });
};

const getFoodByTag = (tag, callback) => {
    db.all('SELECT * FROM food WHERE tags LIKE ?', [`%${tag}%`], (err, rows) => {
        callback(err, rows);
    });
};

const getAllTags = (callback) => {
    db.all('SELECT tags FROM food', [], (err, rows) => {
        if (err) return callback(err, null);

        const tagsMap = {};
        rows.forEach((row) => {
            const tagsArray = row.tags.split(',');
            tagsArray.forEach((tag) => {
                tagsMap[tag] = (tagsMap[tag] || 0) + 1;
            });
        });

        const tags = Object.keys(tagsMap).map((tag) => ({ name: tag, count: tagsMap[tag] }));
        callback(null, tags);
    });
};

module.exports = {
    getAllFood,
    getFoodById,
    getFoodByTag,
    getAllTags,
};
