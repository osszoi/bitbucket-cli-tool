const { loadCredentials } = require('../config');
const { checkBranchExists, fetchRepositoriesLib } = require('../bitbucket');
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

	const repositories = await fetchRepositoriesLib(username, appPassword);
	spinner.stop();
	const table = new Table({
		head: ['Repository', 'Owner', 'URL'],
		colWidths: [40, 20, 50]
	});

	const repos = [];
	const filteredRepositories = repositories.filter((r) =>
		r.name.toLowerCase().includes(cmd.filter?.toLowerCase() ?? '')
	);

	for (let i = 0; filteredRepositories.length; i++) {
		const repo = filteredRepositories[i];

		if (!repo) break;

		const cloneUrl = repo.links.clone.find(
			(link) => link.name === 'https'
		).href;

		if (cmd.branch) {
			const spinner2 = await loading(
				`Checking if branch '${cmd.branch}' exists in ${repo.full_name}`
			);
			const branchExists = await checkBranchExists(
				username,
				appPassword,
				repo.full_name,
				cmd.branch
			);
			spinner2.stop();

			if (branchExists) {
				const [workspace, name] = repo.nameWithWorkspace.split(' / ');
				table.push([name, workspace, cloneUrl]);
				repos.push(cmd.slugOnly ? repo.slug : repo.full_name);
			}
		} else {
			const [workspace, name] = repo.nameWithWorkspace.split(' / ');
			table.push([name, workspace, cloneUrl]);
			repos.push(repo);
		}
	}

	if (cmd.commaSeparated) {
		console.log(repos.toString());
	} else {
		console.log(table.toString());
	}
};
