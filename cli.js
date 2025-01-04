const { Command } = require('commander');

// commands
const setUsername = require('./commands/set-username');
const setPassword = require('./commands/set-password');
const list = require('./commands/list');
const clone = require('./commands/clone');
const listPrs = require('./commands/list-prs');
const createPR = require('./commands/create-pr');

const program = new Command();

program
	.command('set-username <username>')
	.description('Set your Bitbucket username.')
	.action(setUsername);

program
	.command('set-password <appPassword>')
	.description('Set your Bitbucket app password.')
	.action(setPassword);

program
	.command('list')
	.description('List all repositories you have access to.')
	.option('--filter [name]', 'Filter repositories by name', '')
	.action(list);

// // Command: Clone a repository
program
	.command('clone [searchTerm]')
	.description('Clone a repository you have access to.')
	.action(clone);

// // Command: List open pull requests and interact with them
program
	.command('list-prs')
	.description(
		'List open pull requests for a given repository in a selected workspace.'
	)
	.option('--filter [name]', 'Filter repositories by name', '')
	.action(listPrs);

program
	.command('create-pr')
	.description(
		'Create a pull request with the last commit message and branch name in the title.'
	)
	.action(createPR);

program.parse(process.argv);
