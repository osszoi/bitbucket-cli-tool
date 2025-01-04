#!/usr/bin/env node

process.on('SIGINT', () => {
	console.log('\nOperation canceled by user.');
	process.exit(0);
});

require('./cli');
