const { saveCredentials, loadCredentials } = require('../config');

module.exports = (username) => {
	const credentials = loadCredentials();
	credentials.username = username;
	saveCredentials(credentials);
	console.log(`Username set to: ${username}`);
};
