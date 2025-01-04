#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Command } = require('commander');
const axios = require('axios');
const inquirer = require('inquirer').default;
const simpleGit = require('simple-git');
const Table = require('cli-table3');
const { execSync } = require('child_process');

// Define the config file path
const configFilePath = path.join(__dirname, 'config.json');

// Load credentials from the config file
function loadCredentials() {
	if (fs.existsSync(configFilePath)) {
		return JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
	}
	return { username: '', appPassword: '' };
}

// Function to approve a PR
async function approvePR(username, appPassword, workspace, repoSlug, prId) {
	const url = `https://api.bitbucket.org/2.0/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/approve`;
	try {
		const response = await axios.post(
			url,
			{},
			{
				auth: {
					username,
					password: appPassword
				}
			}
		);
		console.log('Pull request approved.');
	} catch (error) {
		// Print the entire error response
		console.error(
			`Failed to approve PR: ${
				error.response
					? JSON.stringify(error.response.data, null, 2)
					: error.message
			}`
		);
	}
}

// Function to decline a PR
async function declinePR(username, appPassword, workspace, repoSlug, prId) {
	const url = `https://api.bitbucket.org/2.0/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/decline`;
	try {
		const response = await axios.post(
			url,
			{},
			{
				auth: {
					username,
					password: appPassword
				}
			}
		);
		console.log('Pull request declined.');
	} catch (error) {
		// Print the entire error response
		console.error(
			`Failed to decline PR: ${
				error.response
					? JSON.stringify(error.response.data, null, 2)
					: error.message
			}`
		);
	}
}

// Function to merge a PR
async function mergePR(username, appPassword, workspace, repoSlug, prId) {
	const url = `https://api.bitbucket.org/2.0/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/merge`;
	try {
		const response = await axios.post(
			url,
			{},
			{
				auth: {
					username,
					password: appPassword
				}
			}
		);
		console.log('Pull request merged.');
	} catch (error) {
		// Print the entire error response
		console.error(
			`Failed to merge PR: ${
				error.response
					? JSON.stringify(error.response.data, null, 2)
					: error.message
			}`
		);
	}
}

// Function to unapprove a PR
async function unapprovePR(username, appPassword, workspace, repoSlug, prId) {
	const url = `https://api.bitbucket.org/2.0/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/approve`;
	try {
		const response = await axios.delete(url, {
			auth: {
				username,
				password: appPassword
			}
		});
		console.log('Pull request unapproved.');
	} catch (error) {
		// Print the entire error response
		console.error(
			`Failed to unapprove PR: ${
				error.response
					? JSON.stringify(error.response.data, null, 2)
					: error.message
			}`
		);
	}
}

// Save credentials to the config file
function saveCredentials(credentials) {
	fs.writeFileSync(configFilePath, JSON.stringify(credentials, null, 2));
}

const program = new Command();

function cloneRepository(cloneUrl) {
	console.log(`Cloning repository from ${cloneUrl}...`);
	try {
		execSync(`git clone ${cloneUrl}`, { stdio: 'inherit' });
		console.log('Repository cloned successfully!');
	} catch (error) {
		console.error('Failed to clone repository:', error);
	}
}

async function fetchWorkspaces(username, appPassword) {
	const url = `https://api.bitbucket.org/2.0/repositories?role=member`;
	try {
		const response = await axios.get(url, {
			auth: {
				username,
				password: appPassword
			}
		});
		return Array.from(
			new Set(response.data.values.map(({ workspace }) => workspace.slug))
		); // Return list of workspace names
	} catch (error) {
		throw new Error('Error fetching workspaces: ' + error.message);
	}
}

async function fetchOpenPRs(username, appPassword, workspace, repoSlug) {
	const url = `https://api.bitbucket.org/2.0/repositories/${workspace}/${repoSlug}/pullrequests?state=OPEN`;
	try {
		const response = await axios.get(url, {
			auth: {
				username,
				password: appPassword
			}
		});
		return response.data.values; // Return the list of open pull requests
	} catch (error) {
		throw new Error('Error fetching PRs: ' + error.message);
	}
}

// Fetch repositories from Bitbucket
async function fetchRepositories(username, appPassword) {
	const baseUrl = `https://api.bitbucket.org/2.0/repositories?role=member`;
	let repositories = [];
	let url = baseUrl;

	try {
		while (url) {
			const response = await axios.get(url, {
				auth: {
					username,
					password: appPassword
				}
			});

			// Add current page's repositories to the list
			repositories = repositories.concat(
				response.data.values.map((repo) => ({
					name: `${repo.owner.display_name} / ${repo.name}`,
					slug: repo.slug, // Add the repository slug
					workspace: repo.owner.username, // Add the workspace
					cloneUrl: repo.links.clone.find((link) => link.name === 'https').href
				}))
			);

			// Update URL to the next page (if any)
			url = response.data.next || null;
		}

		return repositories;
	} catch (error) {
		console.error('Error fetching repositories:', error.message);
		process.exit(1);
	}
}

program
	.command('set-username <username>')
	.description('Set your Bitbucket username.')
	.action((username) => {
		const credentials = loadCredentials();
		credentials.username = username;
		saveCredentials(credentials);
		console.log(`Username set to: ${username}`);
	});

program
	.command('set-password <appPassword>')
	.description('Set your Bitbucket app password.')
	.action((appPassword) => {
		const credentials = loadCredentials();
		credentials.appPassword = appPassword;
		saveCredentials(credentials);
		console.log('App password set.');
	});

// Command: List all repositories
program
	.command('list')
	.description('List all repositories you have access to.')
	.action(async () => {
		const { username, appPassword } = loadCredentials();
		if (!username || !appPassword) {
			console.log(
				'Please set your username and app password using "set-username" and "set-password"'
			);
			return;
		}

		const repositories = await fetchRepositories(username, appPassword);
		const table = new Table({
			head: ['Repository', 'Owner', 'URL'],
			colWidths: [40, 20, 50]
		});

		repositories.forEach((repo) => {
			const [workspace, name] = repo.name.split(' / ');
			table.push([name, workspace, repo.cloneUrl]);
		});

		console.log(table.toString());
	});

// Command: Clone a repository
program
	.command('clone <searchTerm>')
	.description('Clone a repository you have access to.')
	.action(async (searchTerm) => {
		const { username, appPassword } = loadCredentials();
		if (!username || !appPassword) {
			console.log(
				'Please set your username and app password using "set-username" and "set-password"'
			);
			return;
		}

		const repositories = await fetchRepositories(username, appPassword);
		const filteredRepos = repositories.filter((repo) =>
			repo.name.toLowerCase().includes(searchTerm.toLowerCase())
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
					choices
				}
			]);

			cloneRepository(selectedRepo.cloneUrl);
		} else if (filteredRepos.length === 1) {
			cloneRepository(filteredRepos[0].cloneUrl);
		} else {
			console.log('No repositories found with that name.');
		}
	});

// Command: List open pull requests and interact with them
program
	.command('list-prs')
	.description(
		'List open pull requests for a given repository in a selected workspace.'
	)
	.option('--filter <prefix>', 'Filter repositories by prefix')
	.action(async (cmd) => {
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
	});

// Parse arguments
program.parse(process.argv);
