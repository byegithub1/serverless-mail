# Serverless Mail

Serverless email solution, read the [Essential Documents](#essential-documents-for-your-reference) before using this program. This is ONLY intended to retrieve and read what is stored by AWS SES and S3 (inbound), you can use Brevo/Sendinblue, SendGrid or other services for outbound (SMTP) purposes.

- [Serverless Mail](#serverless-mail)
  - [Production Setup](#production-setup)
  - [Development Setup](#development-setup)
    - [This is optional, but just try these baozi](#this-is-optional-but-just-try-these-baozi)
      - [Install](#install)
      - [Upgrade](#upgrade)
  - [Essential Documents for Your Reference](#essential-documents-for-your-reference)

## Production Setup

`bun start` or `npm run start`, that's it.

## Development Setup

Install dependencies using `bun install` command then run `bun dev`. It's up to you which package manager you want to use, NPM, PNPM, Yarn or Bun. This program is designed for NodeJS.

### This is optional, but just try these baozi

> **Bun is under active development.** Use it to speed up your development workflows or run simpler production code in resource-constrained environments like serverless functions. We're working on more complete Node.js compatibility and integration with existing frameworks. Join the [Discord](https://bun.sh/discord) and watch the [GitHub repository](https://github.com/oven-sh/bun) to keep tabs on future releases.

Bun is an all-in-one toolkit for JavaScript and TypeScript apps. It ships as a single executable called `bun`.

At its core is the _Bun runtime_, a fast JavaScript runtime designed as a drop-in replacement for Node.js. It's written in Zig and powered by JavaScriptCore under the hood, dramatically reducing startup times and memory usage.

```bash
bun run index.tsx             # TS and JSX supported out-of-the-box
```

The `bun` command-line tool also implements a test runner, script runner, and Node.js-compatible package manager. Instead of 1,000 node_modules for development, you only need `bun`. Bun's built-in tools are significantly faster than existing options and usable in existing Node.js projects with little to no changes.

```bash
bun test                      # run tests
bun run start                 # run the `start` script in `package.json`
bun install <pkg>             # install a package
bunx cowsay 'Hello, world!'   # execute a package
```

#### Install

Bun supports Linux (x64 & arm64), macOS (x64 & Apple Silicon) and Windows (x64).

> **Linux users** — Kernel version 5.6 or higher is strongly recommended, but the minimum is 5.1.

```sh
# with install script (recommended)
curl -fsSL https://bun.sh/install | bash

# on windows
powershell -c "irm bun.sh/install.ps1 | iex"

# with npm
npm install -g bun

# with Homebrew
brew tap oven-sh/bun
brew install bun

# with Docker
docker pull oven/bun
docker run --rm --init --ulimit memlock=-1:-1 oven/bun
```

#### Upgrade

To upgrade to the latest version of Bun, run:

```sh
bun upgrade
```

Bun automatically releases a canary build on every commit to `main`. To upgrade to the latest canary build, run:

```sh
bun upgrade --canary
```

[View canary build](https://github.com/oven-sh/bun/releases/tag/canary)

## Essential Documents for Your Reference

- [Amazon SES - Developer Guide](https://docs.aws.amazon.com/ses/latest/dg/Welcome.html)
- [AWS SES Email Receiving Endpoints](https://docs.aws.amazon.com/general/latest/gr/ses.html)
- [Forward Incoming Email to an External Destination](https://aws.amazon.com/blogs/messaging-and-targeting/forward-incoming-email-to-an-external-destination)
- [Simple Email Service (Amazon SES) uses AWS KMS](https://docs.aws.amazon.com/kms/latest/developerguide/services-ses.html)

**_© 2024 [NVLL](https://nvll.me)_**
