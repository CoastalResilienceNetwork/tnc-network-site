# tnc-network-site

[![Build Status](https://travis-ci.org/CoastalResilienceNetwork/tnc-network-site.svg?branch=develop)](https://travis-ci.org/CoastalResilienceNetwork/tnc-network-site)

Network Site for displaying a catalog of Regional TNC Sites.

### Requirements

* Node 6.x or greater

### Getting Started

Install the required development dependencies:

```sh
./scripts/setup
```

#### Development

Serve the application on port 8642:

```sh
./scripts/server
```

### Ports

| Service | Port |
| --------| ---- |
| Express dev server | [`8642`](http://localhost:8642) |

### Testing

Lint JS files with ESLint:

```sh
./scripts/lint
```

This project's ESLint setup uses an ES5-compatible version of Airbnb's linting
rules.

### Creating a Release with Git Flow

This project uses git flow for releases of changes to site framework source
code. Prior to making a release, we should also ask TNC whether there are
any outstanding uncommitted configuration changes they'd like to have
included in a versioned release.

You can [find the latest version of `git-flow` to install here](https://github.com/petervanderdoes/gitflow-avh).

Once it's installed, you'll need to enable `git flow` in your local version of
repo by typing:

```sh
git flow init
```

Use the default branch values provided; `master` for the current release,
`develop` for the next release. Since the release process entails pulling
changes from `develop` into a release and then merging into `master`, you should
ensure that `develop` builds successfully on Travis before commencing a release.

After you've enabled `git-flow`, you can use the following commands to make a
release, replacing "1.2.3" with the version you're releasing and updating the
`CHANGELOG.md` and `package.json` files to match the version of your release:

```
git flow release start 1.2.3
vim CHANGELOG.md
vim package.json
git add CHANGELOG.md package.json
git commit -m "1.2.3"
git flow release publish 1.2.3
git flow release finish 1.2.3
```

After you've completed the `git flow` steps, you'll need to push the changes
from your local `master` and `develop` branches back to the main repository:

```
git checkout master
git push origin master
git checkout develop
git push origin develop
git push --tags
```

Once you've pushed the tags, the new release will appear in the project's
["Releases" tab in GitHub](https://github.com/CoastalResilienceNetwork/tnc-network-site/releases).

Edit the latest tagged release to give it a version number as the title -- like
`1.2.3` -- and to add release notes.
