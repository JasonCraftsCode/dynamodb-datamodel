# Road Map for dynamodb-datamodel

DynamoDb-DataModel is intended to be a light weight wrapper around DynamoDb's DocumentClient that makes single table design easier to model and work with in JavaScript (and TypeScript).

To get a more detailed list of task see the [projection tab](https://github.com/JasonCraftsCode/dynamodb-datamodel/projects), specifically the current project [DynamoDB-DataModel v1.0.0](https://github.com/JasonCraftsCode/dynamodb-datamodel/projects/2) and the backlog project [DynamoDB-DataModel vNext](https://github.com/JasonCraftsCode/dynamodb-datamodel/projects/3).

## Goals

- Focus on **single** table design
- Follow SOLID principles, especially around open for extension and reasonable defaults
- Limited dependencies, ideally just node and aws-sdk (both PeerDependencies)
- Support JavaScript and TypeScript equally (avoid complex TypeScript)
- Validation should be optional and exceptions rare, assume proper usage
- Leverage DynamoDb's DocumentClient abilities when ever possible
- Follow open source best practices
- Well documented (using TypeDoc) and well tested (100% test coverage)

## Initial v1.0 version plan

- [x] Create multiple models for a single table.
- [x] Support following item actions (on table and model): get, delete, put and update
- [x] Support following multi-item actions (on table and index): query and scan
- [x] Support an extensible key condition expression
- [x] Support an extensible condition expression
- [x] Support an extensible update expression
- [x] Support an extensible model property schema (called Fields)
- [x] Support a basic set of model fields and capabilities
- [x] Provide basic table and index validation
- [x] Test all of the code (100% test coverage)
- [x] Document all of the code
- [x] Well written and complete readme.md
- [x] Working examples

## v1.x to v2.0 version plan

General hope for v1.x is to avoid breaking changes if at all possible, given the above plan for v1.0 I think that is possible.

- [ ] Support easy to use next/prev pages for query and scan operations
- [ ] Support access patterns for query and scan based operations on tables and indexes
- [ ] Support projection expressions
- [x] Support batch read and write
- [x] Support transactions
- [ ] Add a toModel and toTable order of field processing
- [ ] Consider adding support for writing conditions and itemAttributes with model names and convert to table names.
  - To do this we would need to either pass in a converter or wrap ExpressionAttributes
- [ ] Time to Live (TTL) support
- [ ] Support more advanced model fields and capabilities, like compression, guid ids...
- [ ] Support remainder (...) based fields
- [ ] Provide validation for Model and expressions

For batch and transactions need a way for Model's to add to the read or write operation
then get the mapped data... Ideas:

- Have table create an object that gets handed to a model method, then executed, then accessed through an object return from the model method. Mappings can be ID based and avoid having type info.

```javascript
const read = table.batchRead();
const mRead = model.addBatchRead(read, { id: 'id' });
const result = await read.execute();
const item = mRead.get();

const write = table.transactWrite();
const mUpdate = model.addTransactUpdate(write, { id: 'id', name: 'update name' });
const mPut = model.addTransactPut(write, { id: 'id', name: 'put name' });
// or
const mWrites = model.addTransactWrite(write, { put: [{}], update: [{}] });
// addTransactWrite - support everything in a single method.  Issue: Need to find each item, usually don't need to read/write same module so not really that useful.
// addTransactPut/Updated/Del/ - separate calls for every action.
const result = await write.execute(); // either have execute call each model object or have model objects get result of execute.  I think most of the smarts should be in the model object to get and map the data.
const item1 = mUpdate.get();
const item2 = mPut.get();
// or
const items = mWrites.get();
```

Access Pattern - GSI, query/scan -> array of items, ideas:

- Pass result of GSI query/scan to Model which outputs an array of items.
- Result of GSI query/scan could be processed and separated into groups of items.
- Identifying items can be based on attribute prefix or type attribute or customized function.
- Associates a GSI with a group models.

Access Patterns - 1-to-1, 1-to-many, many-to-1, many-to-many. Would also need to support multiple queries/batchGet (to avoid copying data) and also dynamodb streams (to update copied data). Basics: table/index + query => multiple model items. I don't think there is a way to generically represent

ItemCollection - pk type, sk type, models for converting to output.
query(pk:, sk, start, direction) -> { item[], page, result, next=>(limit:number): result }
Collection<string, SortString, OutItem> {
constructor(table/index, model);

// really doesn't do much and most of these access patterns can be complex.
// just need key condition building and auto convert.
query(pk: PK, sk: SK): Promise<OutItem[]> {
// build key condition
// call table/index query with key condition
// convert results to model and result
}
scan(): Promise<OutItem[]> {}
}
Model:
query({pk, sk}, range, options): {}
scan(range, options)
addBatchGet - save off pk/sk to compare and convert later.
addBatchWrite (put or delete)
addTransactGet
addTransactWrite (check, put, delete, update)

example: get topics for org (mainly just need a helper method and we can call it).
getTopics(orgId, created, range: {start, forward, limit}): {topics[], page, result, next(limit)} {
const key = {pk: orgId, sk: created};
const result = await this.table.query(key, range);
const items = result.items.map(item => {
return this.model.toModel(item);
}, []);
return {items, result, next(limit:number) => { this.getTopics(orgId, created, {start: result.start, forward, limit}) }}
}

- Main table - get all items directly associated/stored with something. Like all replies associated with topic.
- Index - get all items "link" with something. Like all topics and replies a member has created.
- Index - get all items in a different order with something.
- 1-to-many - (parent to children relationship, single parent to multiple children)
- many-to-many - (students to classes relationship, two sets of data that has multiple connections)

## Future ideas

- Add DynamoDb streams support
- Support additional tables (limited multi-table)
- Large item off loading to S3
- Align with NoSQL Workbench concepts and examples
- Table management operations
- Synthesize DynamoDb errors to test that code handles various errors correctly
- Graphql support (like adaptors for pagination, common mappings, errors, ...)
- Adapters for other NoSql Databases

// TODO: Could have Batch and Transact methods be part of a multi-table object. The methods could take
// an array of data (or methods) that could be produced by table or model objects. But there is still
// the issue of mapping table data to model data and also finding the matching output item, especially across
// different tables (yes, single-table-design is top priority, but if we can easily build support for multi-table
// implementations we should do that).
// The biggest down side is that we can't express the action in a single method, which has two options:
// - have Table/Model methods output data that then the Batch/Transact method will turn into its format.
// - Missing:
// - passing batch/transact context and options down to Table or Method.
// - easy way to get the model item that is fetch.
// - have Table/Model methods output a callback function that then resolves the
// - Fixes: passing batch/transact context and options to Table or Method.
// - still has problem with getting model item, though the Table/Model methods could have out params
// that returns a method to get the that data once executed. or could output an object that has
// a resolve (or getParams) method and a method to find and map data results. Though how that
// is implemented isn't straight forward since user would either need to pass in the result or
// the resolve method would need to modify some shared state after the action is executed
// - one tricky issue is that we would want the output of the Table/Model to only be used with
// the associated batch/transact operation at TS compile time. Though if "resolver" object is returned
// with two methods that have different names or params, then that would work.
// Down side of batch/transact objects with Table/Model "add/set" methods is that

// TODO: to support a "next" function we'll need our own "Output" object that has a next function
// along with the output/result data
// Another options is to have a queryNext method which also takes an QueryOutput.
// Would be nice to support an async iteration model. Or an async forEach as each
// page comes in.
