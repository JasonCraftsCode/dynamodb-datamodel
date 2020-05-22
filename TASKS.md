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
  - Prettier
  - Generate documents
  - Auto increment version
  - Auto push to npm
- Add jDocs
- Validate Model (add options to validate)
- Non-Validator coerce (see dynamodb-toolbox)
- Write a Medium article on Single Table Design and using
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
  - model version (combine with type, like modelType:1.0.2) = V or Ver - use table version
  - created/modified user (have global or table based current user) = CU/MU - ??
  - delete = D or TTL - not exists for get/query/scan/put/update condition
  - hidden = H or Hide - not exist for get/query/scan condition
  - readonly = RO or Lock - not exist for delete/put/update condition
- Create a way to model access patterns:
  - One-to-one
  - One-to-many
  - Many-to-many
  - model list (collection) == access patterns
  - Pre-build access patterns (base class?)
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
- dependencies always up to date
- works well with vscode
- open source:
  - well documented
  - well tested (100% code coverage)
  - dependencies up to date
  - automate: PR checks (linting, docs, dependencies, tests, commit comments, api validation)
  - clear: road map, contribution, issue/pr templates, versioning, changelog, licensing,
  - place to discuss and contact maintainer
  - maintained versions?

Environment:

- typescript (or javascript or mix)
- npm
- github
- vscode with following extensions:
  - eslint
  - prettier
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
- symVer based commit comments

general core:

- build/package: bundler, transpile/compile, minifier
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
- docs - typeDoc (or jsdoc)
- multi-project - lerna
- npm cli - yarn or npm
- publishing - semver and breaking change
- sponsorships
- services:
  - [GitHub](http://www.github.com) - see below
  - [DependABot](http://dependabot.com) - dependency updater
  - [NPM](http://npm.org) - package repro
  - [David DM](http://david-dm.org) - dependency monitor
  - [DeepScan](http://deepScan.io) - security?, code quality and code health
  - [Snyk](http://Snyk.io) - security, dependency,
  - [Codacy](http://codacy.com) - security, dependency
  - sonarSource.com -
  - github also has a beta security service.
  - codeCov.io - code coverage
  - shields.io
  - badgeSize.io
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
  - deepScan
  - types: TypeScript
  - license
  - browser or node min version
  - dependABot
  - semver
- files:
  - package.json
  - .esLintIgnore
  - .eslintrc.js
  - .github/workflows
  - .github/\*
  - .vscode
  - .gitignore
  - .npnIgnore
  - .prettyRc
  - tsconfig.json
- tools:
  - [https://github.com/jvitor83/types-autoinstaller]

Non goals or focus:

- Validate json - there are better tools for that like joi or yup
- Coerce data - there are better tools for that like joi or yup
- Does not replace a real model with business logic
- Required - not much value beyond just throwing if not present (validate could do that)
- Default - form of coerce (kind of) though in this case it would also handle output, but could handle simple delete.

Goals/Focus:

- Field Mapping data from model data to table data.
  - Data translation
  - Default - on put, but also output and on update could remove is update is simple (just = default)
    - DefaultInput
    - DefaultOutput
  - ignore (errorActions, ignore):
    - Put (allow put) - could be used by UpdatedDate
    - Update (allow update) - could be used by CreatedData
    - Output (allow output) - could be used by write only fields
    - Put + Update - could be used by a deprecated method or method writing by other means
- Model:
  - Type (for FieldType)
  - Disabled actions (like put and put-replace, to only allow new and update)
  - validator and coerce

Core:

- alias: string - alias is really the most used thing.
- default: value || function
- ignore: function

* init()
* toModel()
* toTable()
* toTableUpdate()
* getTableSchema() - returns map with type, partial, ignore

Field TODO (simplify):

X Make each Field methods and attributes optional
X Remove async methods.
X Remove validator, required, coerce, and other non-goal properties
X Remove function chaining
X ?? remove update - though it does provide better typing??

name = Fields.string({alias: abc});
createdOn = Fields.createdDate({alias: NewOn});

TypeDoc issues:

- @interitDoc should support braces like @link: https://github.com/Microsoft/tsdoc/issues/9
- Support type selectors for @link: https://github.com/Microsoft/tsdoc/blob/master/spec/code-snippets/DeclarationReferences.ts
-
