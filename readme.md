# git-brancheetos 🌶️🧀

CLI tool to make your release pull requests consistent. Enjoy your brancheetos.

Useful if your release pipeline follows this type of flow:

- you deploy to multiple environments (dev, staging/qa, production)
- you deploy to these environments via pull requests
- you set up these pull requests manually

## Usage

The [GitHub CLI](https://cli.github.com) must be used to work with GitHub repositories.

```
brew install gh
gh auth login
```

Install the npm dependency:

global

```
yarn global add git-brancheetos
npm install -g git-brancheetos

brancheetos
```

local to project

```
yarn add git-brancheetos
yarn run brancheetos

npm install git-brancheetos
npx brancheetos
```

By default, the `create` command runs.

```
Usage: brancheetos [options] [command]

Automate your release pull requests. Enjoy your brancheetos 🌶️🧀

Options:
  -V, --version   output the version number
  -h, --help      display help for command

Commands:
  create          Prompt for inputs to create a pull request.
  reset-config    Reset the repo configuration values (use this to re-configure branch names).
  help [command]  display help for command
```
