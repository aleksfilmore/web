// Alias to forward older or alternate function names to the canonical implementation
// Alias wrapper for admin-sales-aggregate (renamed to avoid invalid characters)
const mod = require('./admin-sales-aggregate');

exports.handler = async (event, context) => {
	return mod.handler(event, context);
};
