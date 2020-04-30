# Tasks

Note: To publish run 'npm version patch' then 'npm publish'

- Add a readme.md with the following sections:
  - Title w/ image
  - Shields: git hub build status, code coverage, npm version, SemVer, static code analysis, dependencies,
  - Summary
  - Reason
  - Install
  - Usage
  - Documentation
  - Examples
- Add to build:
  - Pritter
  - Generate documents
  - Auto increment version
  - Auto push to npm
- Add jdocs
- Validate Model (add options to validate)
- Non-Validator coerce (see dynamodb-toolbox)
- Write a Medium artical on Single Table Design and using
- Write detailed examples (js and ts and graphql):
  - Simple table setup
  - Multi index table setup
  - Simple model
  - Complex model
  - Each action with expressions
- Naming guidance
- Globals: delimiters (split, composite), reserve names, validate names, ?onError, default put
- Should we use "type": "module" in package.json? Use ES modules to support better tree shaking?

## Future direction

- Additional fields:
  - Compression
  - Support remainder "..." based attributes
  - base64 date
  - base64 uuid
  - type validation/restriction
  - type coerce (base types: string, number, boolean, sets, binary, null; complex types: ??)
    - both ways: toTable and toModel?
      NOTE: Attribute values cannot be null. String and Binary type attributes must have lengths
      greater than zero. Set type attributes cannot be empty.
  - default - used in put (how about update)
    - both ways: toTable and toModel?
    - should remove attribute if equals default
  - hidden (from table or Model) -
  - required - put (notExists, exists, always) and update
- Prebuilt model fields
  - new id (P+S) - populate FieldSplit w/ pk and sk from table
  - w/ type based prefix -
  - revision (enforce passed revision == current revision to put/update) = R or Rev - update inc w/ optional is equal condition (put would require is equal, to ensure correct inc)
  - created date (type: string, base64, number) = CD - put function add if not exists
  - modified date = MD - update function add set (or existing put)
  - model type = T or Type - Use table name to set T
  - model version (compine with type, like modelType:1.0.2) = V or Ver - use table version
  - created/modified user (have global or table based current user) = CU/MU - ??
  - delete = D or TTL - not exists for get/query/scan/put/update condition
  - hidden = H or Hide - not exist for get/query/scan condition
  - readonly = RO or Lock - not exist for delete/put/update condition
- Create a way to model access patterns:
  - One-to-one
  - One-to-many
  - Many-to-many
  - model list (collection) == access patterns
  - Prebuild access patterns (base class?)
- Transactions
- Batch
- Make it easy to integrate graphql based data models
- Consider using @sullux/aws-sdk for better error and promise handling

## Notes

- Use: [shields](https://shields.io/category/build)

## Taken from @sullux/aws-sdk to make errors easier to understand

```javascript
class AWSEnhancedError extends Error {
  awsError: AWSError;
  args: any[];
  constructor(message: string, error: AWSError, args: any[]) {
    super(message);
    this.awsError = error;
    this.args = args;
  }
}

const functionFor = (target: any, name: string, targetName: string) => (...args: any[]) => {
  const rethrow = (error: AWSError) => {
    throw new AWSEnhancedError(`Error calling ${targetName}.${name}: ${error.message}`, error, args);
  };
  try {
    const result = target[name](...args);
    return result.promise ? result.promise().catch(rethrow) : result;
  } catch (err) {
    return rethrow(err);
  }
};
```

## Best practices and template for typescript (or javascript) npm module

Goals:

- template (or cli) with opinionated best practices
- well commented and linked to document (w/ additional info)
- easy to customize or change
- easy to update existing code to latest best practices with updated dependencies
- dependencies always up todate
- works well with vscode
- open source:
  - well documented
  - well tested (100% code coverage)
  - dependencies up todate
  - automate: PR checks (linting, docs, dependencies, tests, commit comments, api validation)
  - clear: roadmap, contribution, issue/pr templates, versioning, changelog, licensing,
  - place to discuss and contact maintainer
  -

Environment:

- typescript (or javascript or mix)
- npm
- github
- vscode with following extensions:
  - eslint
  - pritter
  - jest/mocha
- jest (or mocha)
- tsc, webpack or rollup
- framework: none, react or vue
- single or multi project

Targets:

- web browsers
- node server
- node tool

vscode integrations:

- test runner
- code coverage
- linter
- prettier
- compiler
- debugging
- symver based commit comments

general core:

- build/package: bundler, transpiler/compiler, minifier
- validation: lint, tests, code coverage
- publish/release
- docs, examples and playgrounds
- editor integration
- services and badges
- project management

Components:

- linter - eslint w/ typescript, jest/mocha, docs (not tslint)
- prettier
- compiler - tsc
- bundler - tsc or webpack or rollup w/ babel
- test w/ code coverage - jest or mocha
- docs - typedoc (or jsdoc)
- multi-project - lerna
- npm cli - yarn or npm
- publishing - semver and breaking change
- sponsorships
- services:
  - github.com - see below
  - dependabot.com - dependency updater
  - npm.org - package repro
  - david-dm.org - dependency monitor
  - deepscan.io - security?, code quality and code health
  - snyk.io - security, depedency,
  - codacy.com - security, dependency
  - github also has a beta security service.
  - codecov.io - code coverage
  - shields.io
  - badgesize.io
  - gist (for chat)
- github:
  - actions: pr, build and release (could also use circle-ci or travis-ci)
  - releases
  - issue template - stale issues
  - PR template
  - project
  - docs
  - license
  - security policy and alerts
- badges
  - build
  - npm w/ version
  - dependencies
  - code coverage
  - deepscan
  - types: TypeScript
  - license
  - browser or node min version
  - dependabot
  - semver
- files:
  - package.json
  - .eslintignore
  - .eslintrc.js
  - .github/workflows
  - .github/\*
  - .vscode
  - .gitignore
  - .npmignore
  - .prettyrc
  - tsconfig.json
- tools:
  - https://github.com/jvitor83/types-autoinstaller
