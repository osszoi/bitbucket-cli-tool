const { loadCredentials } = require('../config');
const { fetchRepositories } = require('../bitbucket');
const Table = require('cli-table3');
const loading = require('../loading');

module.exports = async (cmd) => {
	const { username, appPassword } = loadCredentials();
	if (!username || !appPassword) {
		console.log(
			'Please set your username and app password using "set-username" and "set-password"'
		);
		return;
	}

	const spinner = await loading('Fetching repositories...');

	const repositories = await fetchRepositories(username, appPassword);
	spinner.stop();
	const table = new Table({
		head: ['Repository', 'Owner', 'URL'],
		colWidths: [40, 20, 50]
	});

	repositories
		.filter((r) =>
			r.name.toLowerCase().includes(cmd.filter?.toLowerCase() ?? '')
		)
		.forEach((repo) => {
			const [workspace, name] = repo.name.split(' / ');
			table.push([name, workspace, repo.cloneUrl]);
		});

	console.log(table.toString());
};
