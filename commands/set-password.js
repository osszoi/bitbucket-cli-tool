const { saveCredentials, loadCredentials } = require('../config');

module.exports = (appPassword) => {
	const credentials = loadCredentials();
	credentials.appPassword = appPassword;
	saveCredentials(credentials);
	console.log('App password set.');
};
