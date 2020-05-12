# DynamoDB DataModel

[![Actions Status](https://github.com/JasonCraftsCode/dynamodb-datamodel/workflows/build/badge.svg)](https://github.com/JasonCraftsCode/dynamodb-datamodel/actions)
[![npm](https://img.shields.io/npm/v/dynamodb-datamodel.svg)](https://www.npmjs.com/package/dynamodb-datamodel)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/dynamodb-datamodel)](https://bundlephobia.com/result?p=dynamodb-datamodel@latest)
[![dependencies Status](https://david-dm.org/jasoncraftscode/dynamodb-datamodel/status.svg)](https://david-dm.org/jasoncraftscode/dynamodb-datamodel)
[![DependABot Status](https://flat.badgen.net/dependabot/JasonCraftsCode/dynamodb-datamodel?icon=dependabot)](https://github.com/JasonCraftsCode/dynamodb-datamodel/pulls?q=is%3Apr+label%3Adependencies+)
[![CodeCov](https://codecov.io/gh/JasonCraftsCode/dynamodb-datamodel/branch/master/graph/badge.svg)](https://codecov.io/gh/JasonCraftsCode/dynamodb-datamodel)
[![DeepScan grade](https://deepscan.io/api/teams/8443/projects/11172/branches/162758/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=8443&pid=11172&bid=162758)
[![npm type definitions](https://img.shields.io/npm/types/dynamodb-datamodel)](https://img.shields.io/npm/types/dynamodb-datamodel)
[![npm](https://img.shields.io/npm/l/dynamodb-datamodel.svg)](https://www.npmjs.com/package/dynamodb-datamodel)

**NOTE:** This project is in BETA and is constantly being updated. Please submit [issues/feedback](https://github.com/JasonCraftsCode/dynamodb-datamodel/issues).

The **DynamoDB DataModel** is a javascript and typescript library to simplify working with single table designs on [Amazon DynamoDB](https://aws.amazon.com/dynamodb/). The goal is to be able to easily map an object model into a table based storage model and provide operations for conditions and updates.

## Why

While developing a side project using single table design I found I was frequently writing similar code to map model data to and from table data. Additional writing update and condition expressions was cumbersome. I looked around to see if there was an npm package, including [@aws/dynamodb-data-mapper](https://github.com/awslabs/dynamodb-data-mapper-js), [@AwsPilot/dynamodb](https://github.com/awspilot/dynamodb-oop) project, [@BasePrime's dynamodb](https://github.com/baseprime/dynamodb), [Jeremy Daly's dynamodb-toolbox](https://github.com/jeremydaly/dynamodb-toolbox) and others.

This is not a Object-Relational Mapping (ORM) module, so it doesn't use any SQL concepts. Many SQL concepts don't directly apply to NoSQL data bases like dynamodb, so this tool focuses on the unique capabilities of dynamodb.

This is also not a table management module, since with single table design the table will be created and managed through CloudFormation. This module solely focused on reading and writing table and index data.

## Problems this library focuses on

- **Bidirectional data mapping** - In single table design the primary key attributes for tables and indexes are named in a generic way to allow each item type to use the attributes for different properties, to allow multiple access patterns with limited secondary indexes.
- **Table item update** - Even simple updates to a table item are not easy, especially in the context of data mappings.
- **Table condition expression** - DynamoDb supports conditional writes, but building the ConditionExpression can be tricky, especially in the context of data mappings.
- **Focus on NoSQL capabilities** - Make it easy to use DynamoDb's unique capabilities, and avoid SQL concepts that don't make sense in the NoSQL world (don't be an ORM).
- **Simple to use and open for extension** - Though this library tries to capture the current capabilities of DynamoDb with a simple API surface, it also exposes ways to extend is capabilities to support more complex use cases or if AWS adds additional update, filter or condition expression features.
- **Good TypeScript support** - Not all libraries have good up to date and well documented typescript support.
- **Small and light weight** - The main use case is to run in AWS Lambda so it needs to be small, light weight and have little to no dependencies.

## Non goals

- **Not a validator or coercer** - There are many very good data validators and coercer, like joi, yup, ajv... This library does not attempt to do any validation or coercion, but it is **highly** recommended that you validate (and coerce if desired) the data before writing it to DynamoDb using DynamoDb-DataModel.
- **Not a table manager** - This library is just for reading and writing data to DynamoDb, for most all single table usage the table will be managed through CloudFormation.

## Best Practices

## Installation

Install the DynamoDB DataModel with npm:

```bash
npm i dynamodb-datamodel
```

or yarn:

```bash
yarn add dynamodb-datamodel
```

Dependencies:

- aws-sdk > 2.585.0 (peerDependency)
- node.js > 8.0.0

## Basic usage

Dynamodb-datamodel consists of three core components:

- `Table` - The Table object is the first component you'll need to create and has a one-to-one corelation with a provisioned DynamoDb table. Table is essentially a wrapper around the DynamoDb DocumentClient and is used by the Model objects to read and write data to the table. Following a single table design you'll only need a single table object.
- `Model` - The Model object is the secondary component you'll need to create and has a one-to-one corelation with each of the data types you are storing in the DynamoDb table. You will create multiple Models, one for each data type, and they each will reference the same table object. The Model object contains a schema that defines how the model data will be represented in the dynamodb table. Models are the main object you will be using to read and write data to the DynamoDb table.
- `Field` - The Field objects are created when declaring the Model schema and each data property on the model will be associated with a Field object. There are separate Field classes for each of the native DynamoDb data types (string, number, boolean, binary, null, list, map, string set, number set and binary set), in addition to more advanced fields (like composite, date, created date, type and others). You can also create custom Fields for your own data types. Each Fields main purpose is to map the data between model properties and table attributes (bidirectional), but they can also add update, filter and condition expressions to support more complex behavior. Since there are many types of fields they are all contained within the `Fields` namespace.

Import or require `Table`, `Model` and `Fields` from `dynamodb-datamodel`:

```typescript
import { Table, Model, Fields } from 'dynamodb-datamodel';
```

General usage flow:

1. Import or require `Table`, `Model` and `Fields` from `dynamodb-datamodel`
2. Create DynamoDB DocumentClient
3. (_TypeScript_) Define Table's primary key interface
4. Create Table and define key attributes and schema
5. (_TypeScript_) Define each Model key and data interface
6. Create each Model and define data schema
7. Use the model to read and write data

Example:

```typescript
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
// 1. Import or require `Table`, `Model` and `Fields` from `dynamodb-datamodel`
import { Table, Model, Fields } from 'dynamodb-datamodel';

// 2. Create DynamoDB DocumentClient
const client = new DocumentClient({ convertEmptyValues: true });

// 3. (TypeScript) Define Table's primary key
interface TableKey {
  P: Table.PrimaryKey.PartitionString;
  S?: Table.PrimaryKey.SortString;
}

// 4. Create Table and define key attributes and schema
const table = Table.createTable<TableKey, TableKey>({
  client,
  name: 'SimpleTable',
  keyAttributes: {
    P: Table.PrimaryKey.StringType,
    S: Table.PrimaryKey.StringType,
  },
  keySchema: {
    P: Table.PrimaryKey.PartitionKeyType,
    S: Table.PrimaryKey.SortKeyType,
  },
});

// 5. (TypeScript) Define each Model key and data interface
interface ModelKey {
  id: string;
}
// Define model data that derives from the key
interface ModelItem extends ModelKey {
  name: string;
}

// 6. Create each Model and define data schema
const model = Model.createModel<ModelKey, ModelItem>({
  schema: {
    id: Fields.split({ aliases: ['P', 'S'] }),
    name: Fields.string(),
  },
  table: table as Table, // 'as Table' needed for TypeScript
});

// Additional models can also be defined

// 7. Use the model to read and write data
// Write item
await model.put({ id: 'P-GUID.S-0', name: 'user name' });
// Update item
await model.update({ id: 'P-GUID.S-0', name: 'new user name' });
// Get item
const item = await model.get({ id: 'P-GUID.S-0' });
// Delete item
await model.delete({ id: 'P-GUID.S-0' });
```

## Components

DynamoDB-DataMode is composed of several components that can be used on their own and are used by the higher level components like Fields and Model.

Core:

- [Fields](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/fields.html) - Typed based Fields used in the Model schema to support mapping the model data to and from the table data.
- [Index](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/index.html) - Classes that represents Global or Local Secondary Indexes associated with a table.
- [Model](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/model.html) - Class that uses the model schema and fields to map model data, updates and conditions to the table attributes and maps the table data back to the model.
- [Table](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/table.html) - Class the represents the Table and wraps table actions.

Helpers:

- [Condition](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/condition.html) - Contains methods to build complex condition expressions.
- [ConditionExpression](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/conditionexpression.html) - Contains methods to build complex condition expressions.
- [ExpressionAttributes](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/expressionattributes.html) - Class to hold the condition, key condition and update expressions attribute names and values.
- [KeyCondition](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/keycondition.html) - Contains the method to build sort key conditions for Table.query.
- [KeyExpressionAttributes](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/keyconditionexpression.html) - Help class used to build the key condition expression.
- [Update](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/update.html) - Contains the methods to build any update expression.
- [UpdateExpression](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/updateexpression.html) - Help class used to help build update expressions.

## Table of Contents

## Table

A Table is the first object that you will need to create when working with dynamodb-datamodel. It is the object that contains the configuration data for a provisioned DynamoDb Table and uses the DynamoDb DocumentObject to read and write to the DynamoDb Table.

You can either create a simple JavaScript based Table using `new Table()` or if you want to get additional typescript based type checking and code editor autocomplete you can use `Table.createTable<KEY, ATTRIBUTES>` to create a Table that knows about the primary key types and all key attributes.

Creating a table is simple, there are only three things needed: 1) the name of the DynamoDb table, 2) a map of key attribute types, 3) a map of primary key types.

## Index

DynamoDb supports two types of secondary indexes: local secondary index (LSI) and global secondary index (GSI). Just like Table, an Index object has a one-to-one corelation with a provisioned secondary index. Like `Model`, `Index` uses `Table` to query and scan the secondary indexes of the DynamoDb Table.

Also like Table you can create either a JavaScript based index using `new Index()` or if you want additional typescript based type checking and code editor autocomplete you can use `Index.createIndex<KEY>` to create an Index that knows about its primary key to get some type safety when calling query and queryParam.

Creating a index is simple, there are only three things needed: 1) the name of the secondary index, 2) a map of the primary key types, 3) the projection type.

## Model

## Fields

## Update Expressions

## Condition Expressions

## KeyCondition Expressions

Condition where age > 21 OR ((region = 'US' AND size(interests) > 10) AND interests contain nodejs, dynamodb, or serverless):

```typescript Using Condition helpers
const { and, or, eq, gt, contains, size } = Condition;
const filters = or(
  gt('age', 21),
  and(
    eq('region', 'US'),
    gt(size('interests'), 10),
    or(contains('interests', 'nodejs'), contains('interests', 'dynamodb'), contains('interests', 'serverless')),
  ),
);
```

```typescript Using Field methods to ensure attribute paths are correct
const schema = {
  age: Field.number(),
  region: Field.string(),
  interests: Field.string(),
};

// Assigning a schema to a model will initialize the schema fields with model property name
// which is needed for the field condition methods to work below.
const testModel = new Model({
  name: 'TestModel',
  schema,
});

const { age, region, interests } = schema;
const filters = or(
  age.gt(21),
  and(
    region.eq('US'),
    gt(interests.size(), 10),
    or(interests.contains('nodejs'), interests.contains('dynamodb'), interests.contains('serverless')),
  ),
);
```
