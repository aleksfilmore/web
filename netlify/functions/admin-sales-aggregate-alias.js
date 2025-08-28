// Alias wrapper for admin-sales-aggregate (safe file name)
const mod = require('./admin-sales-aggregate');

exports.handler = async (event, context) => {
    return mod.handler(event, context);
};
