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
- [ ] Document and test all of the code
- [ ] Working examples

## v1.x to v2.0 version plan

General hope for v1.x is to avoid breaking changes if at all possible, given the above plan for v1.0 I think that is possible.

- [ ] Support access patterns for query and scan based operations on tables and indexes
- [ ] Support projection expressions
- [ ] Support batch read and write
- [ ] Support transactions
- [ ] Time to Live (TTL) support
- [ ] Support more advanced model fields and capabilities, like compression, guid ids...
- [ ] Support easy to use next/prev pages for query and scan operations
- [ ] Provide validation for Model and expressions

## Future ideas

- Add DynamoDb streams support
- Support additional tables (limited multi-table)
- Large item off loading to S3
- Align with NoSQL Workbench concepts and examples
- Table management operations
- Synthesize DynamoDb errors to test that code handles various errors correctly
- Graphql support (like adaptors for pagination, common mappings, errors, ...)
- Adapters for other NoSql Databases
