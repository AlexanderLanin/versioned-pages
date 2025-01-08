# versioned-pages

## What is it?

You are working on a project and you have a documentation site. You want to keep
the documentation for each version of your project. This action helps you to
deploy the documentation for each version of your project. Including versions
for pull requests, branches, and tags.

(tags not supported yet)

## How does it work?

This action deploys the documentation for each version into separate folders.
The folder name is the version of the project.

## Advanced usage

The action provides a versions_file which can be used by HTML & JavaScript to
display the versions of the project for dynamic navigation.

(example will be added here)

## How to Use?

You'll need to trigger this action on pull requests, pushes to the main branch,
and branch deletions. Don't forget the deletions.

Your repository must be configured to show the documentation from the "gh-pages"
branch :warn:

Here is an example workflow file:

```yaml
name: Deploy Documentation

on:
  pull_request:
    types: [opened, synchronize, reopened, closed]
  push:
    branches:
      - main
  delete:
    branches: ['*']

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      # Build your documentation here with your build command

      - name: Deploy Versioned Pages
        uses: your-username/deploy-versioned-pages@v0.0.1
        with:
          documentation_folder: 'dist'
          versions_file: 'versions'
```

## Known Issues

- The action will create two commits for new versions. One for the new version
  and one for the versions file.
  [See issue](https://github.com/JamesIves/github-pages-deploy-action/discussions/645#discussioncomment-11610985)
- The action will not remove removed files from the gh-pages branch. Same issue
  as above.
