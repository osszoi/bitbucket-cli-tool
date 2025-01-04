const { loadCredentials } = require('../config');
const {
	fetchRepositories,
	fetchWorkspaces,
	fetchOpenPRs,
	approvePR,
	declinePR,
	mergePR,
	unapprovePR
} = require('../bitbucket');
const inquirer = require('inquirer').default;

module.exports = async (cmd) => {
	const { username, appPassword } = loadCredentials(); // Load credentials from config file

	if (!username || !appPassword) {
		console.log('Credentials not found. Please set your credentials first.');
		return;
	}

	try {
		// Step 1: Fetch available workspaces
		const workspaces = await fetchWorkspaces(username, appPassword);

		if (workspaces.length === 0) {
			console.log('You don’t have access to any workspaces.');
			return;
		}

		// Step 2: Prompt user to select a workspace
		const { selectedWorkspace } = await inquirer.prompt([
			{
				type: 'list',
				name: 'selectedWorkspace',
				message: 'Select a workspace:',
				choices: workspaces
			}
		]);

		// Step 3: Fetch repositories in the selected workspace
		const repositories = await fetchRepositories(username, appPassword);

		if (repositories.length === 0) {
			console.log('No repositories found in this workspace.');
			return;
		}

		// Step 4: Prompt user to select a repository from the filtered list
		const { selectedRepository } = await inquirer.prompt([
			{
				type: 'list',
				name: 'selectedRepository',
				message: 'Select a repository:',
				choices: repositories
					.map((repo) => ({
						name: `${repo.name}`, //  (${repo.cloneUrl})
						value: repo
					}))
					.filter((r) =>
						cmd.filter
							? r.name.toLowerCase().includes(cmd.filter?.toLowerCase())
							: true
					)
			}
		]);

		// Step 5: Fetch open pull requests for the selected repository
		const prs = await fetchOpenPRs(
			username,
			appPassword,
			selectedWorkspace,
			selectedRepository.slug
		);

		if (prs.length === 0) {
			console.log('No open pull requests.');
			return;
		}

		// Step 6: Prompt user to select a pull request
		const { selectedPR } = await inquirer.prompt([
			{
				type: 'list',
				name: 'selectedPR',
				message: 'Select a pull request to interact with:',
				choices: prs.map((pr) => {
					return {
						name: `${pr.title} - ${pr.author.display_name}`,
						value: pr
					};
				})
			}
		]);

		// Step 7: Provide options to approve, decline, or merge
		const { prAction } = await inquirer.prompt([
			{
				type: 'list',
				name: 'prAction',
				message: 'Choose an action for the pull request:',
				choices: [
					{ name: 'Approve', value: 'approve' },
					{ name: 'Decline', value: 'decline' },
					{ name: 'Merge', value: 'merge' },
					{ name: 'Unapprove', value: 'unapprove' } // Added unapprove option
				]
			}
		]);

		// Execute the corresponding action
		switch (prAction) {
			case 'approve':
				await approvePR(
					username,
					appPassword,
					selectedWorkspace,
					selectedRepository.slug,
					selectedPR.id
				);
				break;
			case 'decline':
				await declinePR(
					username,
					appPassword,
					selectedWorkspace,
					selectedRepository.slug,
					selectedPR.id
				);
				break;
			case 'merge':
				await mergePR(
					username,
					appPassword,
					selectedWorkspace,
					selectedRepository.slug,
					selectedPR.id
				);
				break;
			case 'unapprove':
				await unapprovePR(
					username,
					appPassword,
					selectedWorkspace,
					selectedRepository.slug,
					selectedPR.id
				);
				break;
			default:
				console.log('Invalid action');
		}
	} catch (error) {
		console.error(`Error: ${error.message}`);
	}
};
