# DynamoDB DataModel

[![Actions Status](https://github.com/jasonuwbadger/dynamodb-datamodel/workflows/build/badge.svg)](https://github.com/jasonuwbadger/dynamodb-datamodel/actions)
[![npm](https://img.shields.io/npm/v/dynamodb-datamodel.svg)](https://www.npmjs.com/package/dynamodb-datamodel)
[![dependencies](https://david-dm.org/jasonuwbadger/dynamodb-datamodel.svg)](https://david-dm.org/jasonuwbadger/dynamodb-datamodel)
[![Coverage status](https://coveralls.io/repos/github/jasonuwbadger/dynamodb-datamodel/badge.svg?branch=master)](https://coveralls.io/github/jasonuwbadger/dynamodb-datamodel?branch=master)
[![DeepScan grade](https://deepscan.io/api/teams/8443/projects/10631/branches/149533/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=8443&pid=10631&bid=149533)
[![npm type definitions](https://img.shields.io/npm/types/dynamodb-datamodel)](https://img.shields.io/npm/types/dynamodb-datamodel)
[![npm](https://img.shields.io/npm/l/dynamodb-datamodel.svg)](https://www.npmjs.com/package/dynamodb-datamodel)

**NOTE:** This project is in BETA. Please submit [issues/feedback](https://github.com/jasonuwbadger/dynamodb-datamodel/issues).

The **DynamoDB DataModel** is a javascript and typescript library to simplify working with single table designs on [Amazon DynamoDB](https://aws.amazon.com/dynamodb/). The goal is to be able to easily map an object model into a table based storage model and provide operations for conditions and updates.

## Why

While developing a side project using single table design I found I was frequenly writting simular code to map model data to and from table data. Additional writing update and condition expressions was combersome. I looked around to see if there was an npm package, including [@aws/dynamodb-data-mapper](https://github.com/awslabs/dynamodb-data-mapper-js), [@awspilot/dynamodb](https://github.com/awspilot/dynamodb-oop) project, [@baseprime's dynamodb](https://github.com/baseprime/dynamodb), [jeremydaly's dynamodb-toolbox](https://github.com/jeremydaly/dynamodb-toolbox) and others.

This is not a Object-Relational Mapping (ORM) module, so it doesn't use any SQL concepts. Many SQL concepts don't directly apply to NoSQL data bases like dynamodb, so this tool focuses on the unique capibility of dynamodb.

This is also not a table management module, since with single table design the table will be created by CloudFormation. This module solely focused on reading and writing table and index data.

## Features

- **Typescript support** - Model and table data can be modeled as typescript intefaces to provide compiler checks and code editor autocomplete. Module is also written in typescript so typings are always up todate.
- **Bidirectional data mapping** - Maps model data to and from table data.
- **Extensible data mapping** - Consumers can define new model types and the bidirectional data mapping, update and conditions expressions for that type.
- **Easy to use update and condition generation** -

## Installation and Basic Usage

Install the DynamoDB DataModel with npm:

```bash
npm i dynamodb-datamodel
```

or yarn:

```bash
yarn add dynamodb-datamodel
```

Import or require `Table` and `Model` from `dynamodb-datamodel`:

```typescript
import { Table, Model, Fields } from 'dynamodb-datamodel';
```

Create your Table and Model schema (typescript):

```typescript
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Table, Model, Fields } from 'dynamodb-datamodel';

const client = new DocumentClient();

// Define table primary keys so you get type safety when using table actions
interface SimpleTableKey {
  P: Table.PrimaryKey.PartitionString;
  S?: Table.PrimaryKey.SortString;
}

// Create and configure table
const simpleTable = Table.createTable<SimpleTableKey, SimpleTableKey>({
  name: 'SimpleTable',
  keyAttributes: {
    P: Table.PrimaryKey.StringType,
    S: Table.PrimaryKey.StringType,
  },
  keySchema: {
    P: Table.PrimaryKey.PartitionKeyType,
    S: Table.PrimaryKey.SortKeyType,
  },
  client,
});

// Define model key for model actions like get and delete
interface SimpleKey {
  id: string;
}

// Define model data that derives from the key
interface SimpleModel extends SimpleKey {
  name: string;
}

// Create the model with a schema based on the above model interface
const simpleModel = Model.createModel<SimpleKey, SimpleModel>({
  schema: {
    id: Fields.split(['P', 'S']),
    name: Fields.string(),
  },
  table: table as Table, // 'as Table' needed for TypeScript
});
```

## Table Actions

## Update Expression

## Condition Expression

## Model Schema Fields
