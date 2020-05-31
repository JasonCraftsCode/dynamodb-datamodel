# DynamoDB DataModel <!-- omit in TOC -->

[![Actions Status](https://github.com/JasonCraftsCode/dynamodb-datamodel/workflows/build/badge.svg)](https://github.com/JasonCraftsCode/dynamodb-datamodel/actions)
[![npm version](https://badgen.net/npm/v/dynamodb-datamodel)](https://www.npmjs.com/package/dynamodb-datamodel)
[![minzip bundle size](https://badgen.net/bundlephobia/minzip/dynamodb-datamodel)](https://bundlephobia.com/result?p=dynamodb-datamodel)
[![dependencies Status](https://badgen.net/david/dep/jasoncraftscode/dynamodb-datamodel)](https://david-dm.org/jasoncraftscode/dynamodb-datamodel)
[![DependABot Status](https://badgen.net/dependabot/JasonCraftsCode/dynamodb-datamodel?icon=dependabot)](https://github.com/JasonCraftsCode/dynamodb-datamodel/pulls?q=is%3Apr+label%3Adependencies+)
[![CodeCov](https://codecov.io/gh/JasonCraftsCode/dynamodb-datamodel/branch/master/graph/badge.svg)](https://codecov.io/gh/JasonCraftsCode/dynamodb-datamodel)
[![DeepScan grade](https://deepscan.io/api/teams/8443/projects/11172/branches/162758/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=8443&pid=11172&bid=162758)
[![npm type definitions](https://img.shields.io/npm/types/dynamodb-datamodel)](https://www.typescriptlang.org/)
[![npm license](https://badgen.net/npm/license/dynamodb-datamodel)](https://github.com/JasonCraftsCode/dynamodb-datamodel/blob/master/LICENSE)

**NOTE:** This project is in BETA (not yet 1.0.0) and is constantly being updated. Feedback and bugs are very much welcomed [issues/feedback](https://github.com/JasonCraftsCode/dynamodb-datamodel/issues).

The **DynamoDB DataModel** is a javascript and typescript library to simplify working with single table designs on [Amazon DynamoDB](https://aws.amazon.com/dynamodb/). This library builds off of the [aw-sdk DocumentClient](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html) and makes it easy to work with many different item types and access patterns in a single DynamoDB table with secondary indexes.

If you're wondering what single table design is and why you should use it then I recommend you check out the [Resources](#resources) section below. Then come back and check out how DynamoDB-DataModel can help.

<details>
  <summary><b>Table of Context</b> - <i>(click to expand)</i></summary>

- [Why](#why)
- [Problems this library focuses on](#problems-this-library-focuses-on)
- [Non goals](#non-goals)
- [Installation](#installation)
- [Basic usage](#basic-usage)
- [Components](#components)
  - [Table](#table)
  - [Index](#index)
  - [Model](#model)
  - [Fields](#fields)
    - [Core Fields](#core-fields)
    - [Extended Fields](#extended-fields)
    - [Create your own custom fields](#create-your-own-custom-fields)
    - [Example](#example)
  - [Condition or Filter Expressions](#condition-or-filter-expressions)
    - [Condition functions](#condition-functions)
    - [Create your own custom conditions](#create-your-own-custom-conditions)
    - [Condition Examples](#condition-examples)
  - [KeyCondition Expressions](#keycondition-expressions)
    - [Sort key functions](#sort-key-functions)
    - [KeyCondition Examples](#keycondition-examples)
  - [Update Expressions](#update-expressions)
    - [Update functions](#update-functions)
    - [Create your own custom update resolvers](#create-your-own-custom-update-resolvers)
    - [Update Examples](#update-examples)
- [Best practices](#best-practices)
- [Resources](#resources)
- [Contributions and Feedback](#contributions-and-feedback)

</details>

## Why

The [aws-sdk DocumentClient](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html) is a great library that allows applications to use native JavaScript types when reading and writing data to a DynamoDB table. But as you work more with single table designs you'll find yourself frequently mapping your application data to secondary index key attributes to support your various access patterns. Additionally, the DocumentClient provides very little help building expressions for key condition, write condition, filter and update.

This is where DynamoDB-DataModel comes into play, by making it easy to map the data between your application models and how it stored in the DynamoDB table to leverage single table design and support all of your applications access patterns. It also makes it easy to build expressions for key condition, write condition, filter and update, even using your model properties names.

## Problems this library focuses on

- **Bidirectional data mapping** - In single table design the primary key attributes for tables and indexes are named in a generic way to allow each item type to use the attributes for different properties, to allow multiple access patterns with limited secondary indexes.
- **Table item update** - Even simple updates to a table item are not easy, especially in the context of data mappings.
- **Table condition and filter expression** - DynamoDB supports conditional writes or filtered queries/scans, but building the ConditionExpression/FilterExpression can be tricky, especially in the context of data mappings.
- **Focus on NoSQL capabilities** - Make it easy to use DynamoDB's unique capabilities, and avoid SQL concepts that don't make sense in the NoSQL world (don't be an ORM).
- **Simple to use and open for extension** - Though this library tries to capture the current capabilities of DynamoDB with a simple API surface, it also exposes ways to extend is capabilities to support more complex use cases or if AWS adds additional update, filter or condition expression features.
- **Good TypeScript support** - Not all libraries have good, up to date and well documented typescript support.
- **Small and light weight** - The main use case is to run in AWS Lambda so it needs to be small, light weight and have little to no dependencies.

## Non goals

- **Not a validator or coercer** - There are already many very good open source data validators and coercer, like [joi](https://www.npmjs.com/package/@hapi/joi), [yup](https://www.npmjs.com/package/yup), [ajv](https://www.npmjs.com/package/ajv) and others. This library does not attempt to do any validation or coercion, but it is **highly** recommended that you validate and coerce the data before writing it to DynamoDB using DynamoDB-DataModel.
- **Not a table manager** - This library is just for reading and writing data to DynamoDB, for most all single table usage the table will be managed through CloudFormation.
- **Not a Object-Relational Mapping (ORM)** - DynamoDB-Datamodel doesn't use any SQL concepts. Many SQL concepts don't directly apply to NoSQL data bases like dynamodb, so this tool focuses on the unique capabilities of dynamodb. If you need an ORM, there are several existing libraries: [@aws/dynamodb-data-mapper](https://github.com/awslabs/dynamodb-data-mapper-js), [@AwsPilot/dynamodb](https://github.com/awspilot/dynamodb-oop) project or [@BasePrime's dynamodb](https://github.com/baseprime/dynamodb)

Note: As I was factoring this library out of a personal project, I came across [Jeremy Daly's dynamodb-toolbox](https://github.com/jeremydaly/dynamodb-toolbox) the v0.1 version and played around with it, but it didn't have typescript support and didn't quite fit my personal project needs. I also felt that DynamoDB-DataModel had a unique and extensible take on building key condition, condition, filter and update expressions. And the ability to have custom fields for model schemes has made it easy to extend the libraries core capabilities.

## Installation

Install the DynamoDB-DataModel with npm:

```bash
npm i dynamodb-datamodel
```

or yarn:

```bash
yarn add dynamodb-datamodel
```

Dependencies:

- aws-sdk >= 2.585.0 (peerDependency)
- node.js >= 8.0.0

## Basic usage

DynamoDB-DataModel consists of three core components:

- [`Table`](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/table.html) - The Table object is the first component you'll need to create and has a one-to-one corelation with a provisioned DynamoDB table. Table is essentially a wrapper around the [DynamoDB DocumentClient](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html) and is used by the Model objects to read and write data to the table. Following a single table design you'll only need a single table object.
- [`Model`](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/model.html) - The Model object is the secondary component you'll need to create and has a one-to-one corelation with each of the data item types you are storing in the DynamoDB table. You will create multiple Models, one for each data item type, and they each will reference the same table object. The Model object contains a schema that defines how the model data will be represented in the dynamodb table. Models are the main object you will be using to read and write data to the DynamoDB table.
- [`Field`](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/fields.html) - The Field objects are created when declaring the Model schema and each item data property on the model will be associated with a Field object. There are separate Field classes for each of the native DynamoDB data types (string, number, boolean, binary, null, list, map, string set, number set and binary set), in addition to more advanced fields (like composite, date, created date, type and others). You can also create custom Fields for your own data types. Each Fields main purpose is to map the data between model properties and table attributes (bidirectional), but they can also add update, filter and condition expressions to support more complex behavior. Since there are many types of fields they are all contained within the `Fields` namespace.
- [`Index`](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/tableindex.html) - Index objects are created along side the `Table`

Import or require `Table`, `Model` and `Fields` from `dynamodb-datamodel`:

```typescript
import { Table, Model, Fields } from 'dynamodb-datamodel';
```

General usage flow:

1. Import or require `Table`, `Model` and `Fields` from `dynamodb-datamodel`
2. Create [DynamoDB DocumentClient](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html)
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
- [Index](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/tableindex.html) - Classes that represents Global or Local Secondary Indexes associated with a table.
- [Model](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/model.html) - Class that uses the model schema and fields to map model data, updates and conditions to the table attributes and maps the table data back to the model.
- [Table](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/table.html) - Class the represents the Table and wraps table actions.

Expressions:

- [Condition](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/condition.html) - Contains functions for building complex condition and filter expressions.
- [ConditionExpression](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/conditionexpression.html) - Object passed to the resolvers returned by the `Condition` functions.
- [ExpressionAttributes](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/expressionattributes.html) - Object that maps and saves expression attribute names and values to a placeholder, used by ConditionExpression, KeConditionExpression and UpdateExpression.
- [KeyCondition](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/keycondition.html) - Contains functions for building sort key conditions used in `Table.query` and `Index.query` methods.
- [KeyExpressionExpression](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/keyconditionexpression.html) - Object passed to the resolvers return by the `KeyCondition` functions.
- [Update](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/update.html) - Contains functions for building complex update expressions used in `Table.update` and `Module.update` methods.
- [UpdateExpression](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/updateexpression.html) - Object passed to the resolves return by the `Update` functions.

### Table

`Table` is the first object that you will need to create when working with dynamodb-datamodel. It is the object that contains the configuration data for a provisioned DynamoDB Table and uses the DynamoDB DocumentObject to read and write to the DynamoDB Table.

You can either create a simple JavaScript based Table using `new Table()` or if you want to get additional typescript based type checking and code editor autocomplete you can use `Table.createTable<KEY, ATTRIBUTES>` to create a Table.

Creating a table is simple, there are only three things needed: 1) the name of the DynamoDB table, 2) a map of key attribute types, 3) a map of primary key types.

```typescript
```

### Index

DynamoDB supports two types of secondary indexes: local secondary index (LSI) and global secondary index (GSI). Just like Table, an Index object has a one-to-one corelation with a provisioned secondary index. Like `Model`, `Index` uses `Table` to query and scan the secondary indexes of the DynamoDB Table.

Also like Table you can create either a JavaScript based index using `new Index()` or if you want additional typescript based type checking and code editor autocomplete you can use `Index.createIndex<KEY>` to create an Index.

Creating a index is simple, there are only three things needed: 1) the name of the secondary index, 2) a map of the primary key types, 3) the projection type.

```typescript
```

### Model

```typescript
```

### Fields

#### Core Fields

| Name                                                                                            | Table Type | Description               |
| :---------------------------------------------------------------------------------------------- | :--------- | :------------------------ |
| [string](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/fields.html#string)       | S          | JavaScript string         |
| [number](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/fields.html#number)       | N          | JavaScript number         |
| [binary](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/fields.html#binary)       | B          | JavaScript binary         |
| [boolean](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/fields.html#boolean)     | BOOL       | JavaScript boolean        |
| [stringSet](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/fields.html#stringset) | SS         | DocumentClient string set |
| [numberSet](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/fields.html#numberset) | NS         | DocumentClient number set |
| [binarySet](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/fields.html#binaryset) | BS         | DocumentClient binary set |
| [list](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/fields.html#list)           | L          | JavaScript list           |
| [map](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/fields.html#map)             | M          | JavaScript map            |

#### Extended Fields

| name                                                                                                      | Table Type | Description                                                |
| :-------------------------------------------------------------------------------------------------------- | :--------- | :--------------------------------------------------------- |
| [model](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/fields.html#model)                   | M          |                                                            |
| [modelList](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/fields.html#modellist)           | L          | List of models                                             |
| [modelMap](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/fields.html#modelmap)             | M          |                                                            |
| [date](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/fields.html#date)                     | N          | JavaScript Date                                            |
| [hidden](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/fields.html#hidden)                 | -          | Hide field from getting written to DynamoDB                |
| [split](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/fields.html#split)                   | S          | Split the field property into multiple DynamoDB attributes |
| [composite](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/fields.html#composite)           | S          |                                                            |
| [compositeNamed](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/fields.html#compositenamed) | S          |                                                            |
| [type](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/fields.html#type)                     | S          |                                                            |
| [createdDate](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/fields.html#createdate)        | N          |                                                            |
| [updatedDate](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/fields.html#updatedate)        | N          |                                                            |
| [revision](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/fields.html#revision)             | N          |                                                            |

#### Create your own custom fields

#### Example

```typescript
```

### Condition or Filter Expressions

#### Condition functions

| Name                                                                                                 | Supported Types        | Description |
| :--------------------------------------------------------------------------------------------------- | :--------------------- | :---------- |
| [path](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/condition.html#path-1)           | all                    |             |
| [size](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/condition.html#size)             | B, BS, NS, S, SS, M, L |             |
| [compare](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/condition.html#compare)       | all                    |             |
| [eq](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/condition.html#eq)                 | all                    |             |
| [ne](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/condition.html#ne)                 | all                    |             |
| [ge](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/condition.html#ge)                 | all                    |             |
| [gt](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/condition.html#gt)                 | all                    |             |
| [le](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/condition.html#le)                 | all                    |             |
| [lt](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/condition.html#lt)                 | all                    |             |
| [between](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/condition.html#between)       | all                    |             |
| [beginsWith](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/condition.html#beginswith) | S                      |             |
| [contains](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/condition.html#contains)     | S, BS, NS, SS          |             |
| [in](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/condition.html#in)                 | all                    |             |
| [exists](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/condition.html#exists)         | all                    |             |
| [notExists](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/condition.html#notExists)   | all                    |             |
| [type](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/condition.html#type)             | all                    |             |
| [and](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/condition.html#and)               | conditions             |             |
| [or](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/condition.html#or)                 | conditions             |             |
| [not](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/condition.html#not)               | conditions             |             |

#### Create your own custom conditions

#### Condition Examples

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

### KeyCondition Expressions

#### Sort key functions

The Partition key only supports a single condition which is equal ('='). Sort keys support several 'range' based conditions to query for a continuous range of items. You may notice that not-equal ('<>') isn't support and the reason is simply that a not-equal query would not return a continuous range of items.

| Name                                                                                                    | Supported Types | Description                                                                                |
| :------------------------------------------------------------------------------------------------------ | :-------------- | :----------------------------------------------------------------------------------------- |
| [beginsWith](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/keycondition.html#beginswith) | S               | Return all items that begin with the value. Note: case sensitive. Example: `KeyCondition.` |
| [between](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/keycondition.html#between)       | B, N, S (all)   |                                                                                            |
| [compare](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/keycondition.html#compare)       | B, N, S (all)   |                                                                                            |
| [eq](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/keycondition.html#eq)                 | B, N, S (all)   |                                                                                            |
| [ge](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/keycondition.html#ge)                 | B, N, S (all)   |                                                                                            |
| [gt](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/keycondition.html#gt)                 | B, N, S (all)   |                                                                                            |
| [le](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/keycondition.html#le)                 | B, N, S (all)   |                                                                                            |
| [lt](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/keycondition.html#lt)                 | B, N, S (all)   |                                                                                            |

Note: All of the above KeyCondition functions return a resolver function, allowing for custom KeyConditions, though current DynamoDB

#### KeyCondition Examples

```typescript
```

### Update Expressions

#### Update functions

For more details on what you can do with update expressions see [DynamodDB's Update Expression guide](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.UpdateExpressions.html).

Supported [Update](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/update.html) functions:
| Name | Supported Types | Description |
| :---------------------------------------------------------------------------------------------------------- | :-------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [path](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/update.html#path) | all | Ensures that a value is treated as a path. Example: `{ name: Update.path('fullname') }` |
| [pathWithDefault](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/update.html#pathwithdefault) | all | Ensures that a value is either a path or a default value if the path doesn't exists. Example: `{ name: Update.pathWithDefault('fullname', 'John Smith')}`. |
| [default](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/update.html#default) | all | Ensures an attribute has a default value. Example: `{ name: Update.default('John Smith') }`, if name doesn't exists then set it to 'John Smith'. |
| [del](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/update.html#del) | all | Deletes an attribute from item, can also assign `null` to a value. Example : `{ name: Update.del() }` or `{ name: null }`. |
| [set](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/update.html#set) | all | Sets an attribute to a value, can also assign value directly. Example: `{ name: Update.set('John Smith') }` or `{ name: 'John Smith }` |
| [arithmetic](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/update.html#arthmetic) | N | Preforms basic arithmetic on an attribute, used by in, dec, add and sub below. Example: `{ total: Update.arithmetic('total', '+', 1) }`, adds 1 to total attribute. |
| [inc](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/update.html#inc) | N | Increments an attribute by a value. Example: `{ total: Update.inc(2) }`, increments total by 2. |
| [dec](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/update.html#dec) | N | Decrements an attribute by a value. Example: `{ total: Update.dec(3) }`, decrements total by 3. |
| [add](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/update.html#add) | N | Sets the receiving attribute to the addition of a value to the value of an attribute. Example: `{ total: Update.add('count', 1) }`, set total to the result of adding 1 to the value of 'count'. |
| [sub](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/update.html#sub) | N | Sets the receiving attribute to the subtraction of a value from the value of an attribute. Example: `{ total: Update.sub('count', 2) }` , set total to the result of subtrating 1 from the value of 'count'. |
| [join](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/update.html#join) | L | Sets the receiving attribute to the result of joining two lists. Example: `{ relatives: Update.join('children', 'parents') }`, set the relative attribute to the result of join children and parents together. |
| [append](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/update.html#append) | L | Appends a list to the beginning of a list attribute. `{ relatives: Update.append('children') }`, appends the value of the children attribute to relatives. |
| [prepend](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/update.html#prepend) | L | Prepends a list to the end of an list attribute. `{ relatives: Update.prepend('parents') }`, appends the value of the children attribute to relatives. |
| [delIndexes](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/update.html#delindexes) | L | Deletes values from a list attribute using an array of indexes. `{ relatives: Update.delIndexes([1, 3]) }` , deletes the 1 and 3 value from the relatives list attribute. |
| [setIndexes](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/update.html#setindexes) | L | Sets the values from a list attribute using a map of indexes to values. `{ relatives: Update.setIndexes({1:'bob', 3:'lucy'}) }` , sets value at index 1 to 'bob' and value in index 3 to 'lucy' in relatives list attribute. |
| [addToSet](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/update.html#addtoset) | SS, NS, BS | Add values to a DynamoDB set attribute. Example: `{ color: Update.addToSet(table.createStringSet(['yellow', 'red'])) }`, adds yellow and red to the color set attribute. |
| [removeFromSet](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/update.html#removefromset) | SS, NS, BS | Remove values from a DynamoDB set attribute. Example: `{ color: Update.removeFromSet(table.createStringSet(['blue', 'green'])) }`, removes blue and green from the color set attribute. |
| [map](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/update.html#map) | M | Sets the receiving map attribute to the result of resolving a map of Update functions. Can also support '.' delimited path values for setting deep values. Example: `{ address: Update.map( street: 'One Infinity Loop' ) }`, sets the street attribute within address to 'One Infinity Loop''. |
| [model](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/update.html#model) | M | Typed based wrapper around map to ensure the input matches an interface. Example: see [Update.model](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/update.html#model) |
| [modelMap](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/update.html#modelmap) | M | String based key to model map, that enforces the key strings are only used as paths. Example: see [Update.modelMap](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/update.html#modelmap) |

#### Create your own custom update resolvers

All of the above Update functions just return a [Update.Resolver](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/update.html#resolver) arrow function with the signature of: `(name: string, exp: Update.Expression, type?: T) => void`. When [Model.update](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/model.html#update) or [Table.update](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/table.html#update) run each object property value will get resolved and values that have a type of 'function' will get called with the property name, an [Update.Expression](https://jasoncraftscode.github.io/dynamodb-datamodel/interfaces/update.expression.html) object and an optional type param.

It is in the implementation of the [Update.Resolver](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/update.html#resolver) functions that the update expression is constructed. This is done by calling methods on the [Update.Expression](https://jasoncraftscode.github.io/dynamodb-datamodel/interfaces/update.expression.html) object to add and get placeholders for attribute names and paths, and add expressions to one of the four support clauses: SET, REMOVE, ADD or DELETE.

After all [Update.Resolver](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/update.html#resolver) are called and all other expressions are resolved, the expressions for the update are generated and set on the input params passed to the DynamoDB DocumentClient update method.

To create custom Update functions you just need to return an arrow function that when called adds the necessary names, values and update expressions to support the functionality you need.

**Note**: In future versions of this library I am looking to add additional context (like Model or Field) to the [Update.Expression](https://jasoncraftscode.github.io/dynamodb-datamodel/interfaces/update.expression.html), to enable more advanced scenarios. Let me know if you need this so I can prioritize it appropriately.

#### Update Examples

```typescript
```

## Best practices

- Use generic primary key names for Tables and Indexes. Examples:
  - Table: 'P' = partition key and 'S' = sort key.
  - Index: 'G0P' = partition key and 'G0S' = sort key for Global Secondary Index #0.
- Use generic secondary index names since they will be used for many different access patterns. Example: GSI0 or LSI0.
- Normalize values used in index primary keys, like lower case strings or use generated values.

## Resources

There are a lot of DynamoDB resources out there, with more being added every day. But I would start with the following:

- [Advanced Design Patterns for DynamoDB](https://www.youtube.com/watch?v=HaEPXoXVf2k&t=310s) talk by [Rick Houlihan](https://twitter.com/houlihan_rick) - This talk is just mind blowing, Rick really drives home how useful DynamoDB can be.
- [DynamoDB Single Table Design](https://www.alexdebrie.com/posts/dynamodb-single-table/) blog post by [Alex DeBrie](https://twitter.com/alexbdebrie) - Good summary of the what, when and why of single table design. Alex's blog also has many other good DynamoDB posts.
- [The DynamoDB Book](https://www.dynamodbbook.com/) by [Alex DeBrie](https://twitter.com/alexbdebrie) - Probably the most approachable and best written guild for DynamoDB and single table design. It's not free like the other resources but well worth the investment.
- [Awesome-DynamoDB](https://github.com/alexdebrie/awesome-dynamodb) - List of resources for learning about modeling, operating, and using Amazon DynamoDB.

## Contributions and Feedback

Any and all contributions are greatly appreciated! For suggestions, feedback and bugs, please create a [new issue](https://github.com/JasonCraftsCode/dynamodb-datamodel/issues/new/choose). For contributions you can start a [pull request](https://github.com/JasonCraftsCode/dynamodb-datamodel/compare). Feel free contact me on Twitter: [@JasonCraftsCode](https://twitter.com/JasonCraftsCode)
