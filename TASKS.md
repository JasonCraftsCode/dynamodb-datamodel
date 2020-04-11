# Tasks

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
  - Code coverage
  - Pritter
  - Generate documents
  - Auto increment version
  - Auto push to npm
- Add jdocs
- Add types to class namespaces (Table, Model, Condition, Update)
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

- Use: https://shields.io/category/build

## Taken from @sullux/aws-sdk

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
