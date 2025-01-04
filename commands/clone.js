const { loadCredentials } = require('../config');
const { fetchRepositories, cloneRepository } = require('../bitbucket');
const inquirer = require('inquirer').default;
const loading = require('../loading');
const hjklSupport = require('../compatibility/hjkl');

module.exports = async (searchTerm) => {
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

	const filteredRepos = repositories.filter((repo) =>
		repo.name.toLowerCase().includes(searchTerm?.toLowerCase() ?? '')
	);

	if (filteredRepos.length > 1) {
		const choices = filteredRepos.map((repo) => ({
			name: `${repo.name} (${repo.cloneUrl})`,
			value: repo
		}));

		const { selectedRepo } = await inquirer.prompt([
			{
				type: 'list',
				name: 'selectedRepo',
				message: 'Choose a repository to clone:',
				choices,
				...hjklSupport
			}
		]);

		cloneRepository(selectedRepo.cloneUrl);
	} else if (filteredRepos.length === 1) {
		cloneRepository(filteredRepos[0].cloneUrl);
	} else {
		console.log('No repositories found with that name.');
	}
};
