# Bitbucket CLI Tools

Bitbucket CLI tool for listing and cloning repositories, managing pull requests, and setting credentials.

## Installation

```sh
npm install -g bitbucket-cli-tools
```

## Usage

### Set Username

Set your Bitbucket username.

```sh
bb set-username <username>
```

### Set App Password

Set your Bitbucket app password.

```sh
bb set-password <appPassword>
```

### List Repositories

List all repositories you have access to.

```sh
bb list [--filter <name>]
```
- `--filter <name>`: Filter repositories by name.

## Clone Repository

Clone a repository you have access to.

```sh
bb clone [searchTerm]
```

- `searchTerm`: Optional search term to filter repositories by name.


## List Pull Requests

List open pull requests for a given repository in a selected workspace.

```sh
bb list-prs [--filter <name>]
```
- `--filter <name>`: Filter repositories by name.

## Create Pull Request

Create a pull request with the last commit message and branch name in the title.

```sh
bb create-pr
```

# License
This project is licensed under the MIT License.
