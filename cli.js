const { Command } = require('commander');

// commands
const setUsername = require('./commands/set-username');
const setPassword = require('./commands/set-password');
const list = require('./commands/list');
const clone = require('./commands/clone');
const listPrs = require('./commands/list-prs');
const createPR = require('./commands/create-pr');

const program = new Command();

program.name('bb');

// Examples
program.on('--help', () => {
	console.log('');
	console.log('Examples:');
	console.log('');
	console.log('  Authentication:');
	console.log('    $ bitbucket set-username YOUR_USERNAME');
	console.log('    $ bitbucket set-password YOUR_APP_PASSWORD');
	console.log('');
	console.log('  List repositories:');
	console.log(
		'    $ bitbucket list                                 # List all repositories'
	);
	console.log(
		'    $ bitbucket list --filter project-name           # Filter repos by name'
	);
	console.log(
		'    $ bitbucket list --branch feature                # Filter repos with specific branch'
	);
	console.log(
		'    $ bitbucket list --comma-separated               # Output as comma-separated list'
	);
	console.log(
		'    $ bitbucket list --comma-separated --slug-only   # Output only repository slugs'
	);
	console.log('');
	console.log('  Clone repository:');
	console.log(
		'    $ bitbucket clone                                # Interactive repository selection'
	);
	console.log(
		'    $ bitbucket clone my-project                     # Quick search and clone'
	);
	console.log('');
	console.log('  Pull Requests:');
	console.log(
		'    $ bitbucket list-prs                             # List and interact with PRs'
	);
	console.log(
		'    $ bitbucket list-prs --filter backend            # Filter PRs by repository name'
	);
	console.log(
		'    $ bitbucket create-pr                            # Create PR from current branch'
	);
});


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
	.option('--branch [name]', 'Filter repositories that has branch', '')
	.option('--comma-separated', 'Output the result as array', '')
	.option('--slug-only', 'Output the result as array', '')
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
