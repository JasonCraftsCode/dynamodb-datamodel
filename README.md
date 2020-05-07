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

This is also not a table management module, since with single table design the table will be created by CloudFormation. This module solely focused on reading and writing table and index data.

## Features

- **Typescript support** - Model and table data can be modeled as typescript interfaces to provide compiler checks and code editor autocomplete. Module is also written in typescript so typings are always up to date.
- **Bidirectional data mapping** - Maps model data to and from table data.
- **Extensible data mapping** - Consumers can define new model types (referred to as Field) and the bidirectional data mapping, update and conditions expressions for that type.
- **Easy to use condition expressions** -
- **Easy to use update expressions** -
- **Composable and extensible components** -

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

Import or require `Table` and `Model` from `dynamodb-datamodel`:

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
const client = new DocumentClient();

// 3. [TypeScript] Define Table's primary key
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

// 5. [TypeScript] Define each Model key and data interface
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
    id: Fields.split(['P', 'S']),
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

- [Condition](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/condition.html) - Contains methods to build complex condition expressions.
- [ExpressionAttributes](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/ExpressionAttributes.html) - Class to hold the condition, key condition and update expressions attribute names and values
- [Fields](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/fields.html) - Typed based Fields used in the Model schema to support mapping the model data to and from the table data.
- [Index](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/index.html) - Classes that represents Global or Local Secondary Indexes associated with a table
- [KeyCondition](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/keycondition.html) - Contains the method to build sort key conditions for Table.query
- [KeyExpressionAttributes](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/KeyExpressionAttributes.html) - Help class used to build the key condition expression
- [Model](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/model.html) - Class that uses the model schema and fields to map model data, updates and conditions to the table attributes and maps the table data back to the model.
- [Table](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/table.html) - Class the represents the Table and wraps table actions
- [Update](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/update.html) - Contains the methods to build any update expression
- [UpdateExpression](https://jasoncraftscode.github.io/dynamodb-datamodel/classes/UpdateExpression.html) - Help class used to help build update expressions

## Table of Contents

## Table

## Index

## Model

## Fields

## Update Expressions

## Condition Expressions

## KeyCondition Expressions
