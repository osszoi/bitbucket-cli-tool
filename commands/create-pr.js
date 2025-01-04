const { loadCredentials } = require('../config');
const { execSync } = require('child_process');
const inquirer = require('inquirer').default;
const { createPullRequest } = require('../bitbucket');

const getGitRemoteUrl = () =>
	execSync('git config --get remote.origin.url').toString().trim();

const parseGitRemoteUrl = (url) => {
	const match = url.match(/[:\/]([^\/]+)\/([^\/]+)(?:\.git)?$/);
	if (!match) throw new Error('Invalid remote URL');
	return { workspace: match[1], repository: match[2] };
};

module.exports = async () => {
	const { username, appPassword } = loadCredentials();

	if (!username || !appPassword) {
		console.log(
			'Please set your username and app password using "set-username" and "set-password"'
		);
		return;
	}

	try {
		const branchName = execSync('git rev-parse --abbrev-ref HEAD')
			.toString()
			.trim();
		const lastCommitMessage = execSync('git log -1 --pretty=%B')
			.toString()
			.trim();
		const title = `${branchName}: ${lastCommitMessage}`;

		const remoteUrl = getGitRemoteUrl();
		const { workspace, repository } = parseGitRemoteUrl(remoteUrl);

		const { destinationBranch } = await inquirer.prompt([
			{
				type: 'input',
				name: 'destinationBranch',
				message: 'Enter the destination branch:',
				default: 'master'
			}
		]);

		await createPullRequest(
			username,
			appPassword,
			workspace,
			repository,
			title,
			branchName,
			destinationBranch
		);
	} catch (error) {
		console.error('Error:', error.message);
	}
};
