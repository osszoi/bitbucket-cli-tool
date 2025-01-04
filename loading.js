module.exports = async (message) => {
	const ora = (await import('ora')).default;
	return ora(message).start();
};
