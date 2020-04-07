# DynamoDB DataModel

[![Actions Status](https://github.com/jasonuwbadger/dynamodb-datamodel/workflows/build/badge.svg)](https://github.com/jasonuwbadger/dynamodb-datamodel/actions)
[![npm](https://img.shields.io/npm/v/dynamodb-datamodel.svg)](https://www.npmjs.com/package/dynamodb-datamodel)
[![npm](https://img.shields.io/npm/l/dynamodb-datamodel.svg)](https://www.npmjs.com/package/dynamodb-datamodel)
[![dependencies](https://david-dm.org/jasonuwbadger/dynamodb-datamodel.svg)](https://david-dm.org/jasonuwbadger/dynamodb-datamodel)
[![Coverage Status](https://coveralls.io/repos/github/jasonuwbadger/dynamodb-datamodel/badge.svg)](https://coveralls.io/github/jasonuwbadger/dynamodb-datamodel)
[![DeepScan grade](https://deepscan.io/api/teams/8443/projects/10631/branches/149533/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=8443&pid=10631&bid=149533)
[![npm type definitions](https://img.shields.io/npm/types/dynamodb-datamodel)](https://img.shields.io/npm/types/dynamodb-datamodel)

### **NOTE:** This project is in BETA. Please submit [issues/feedback](https://github.com/jasonuwbadger/dynamodb-datamodel/issues).

The **DynamoDB DataModel** is a javascript and typescript library to simplify working with single table designs on [Amazon DynamoDB](https://aws.amazon.com/dynamodb/). The goal is to be able to easily map an object model into a table based storage model and provide operations for conditions and updates.

## Why

## Features

## Installation and Basic Usage

Install the DynamoDB DataModel with npm:

```bash
npm i dynamodb-datamodel
```

or yarn:

```bash
yarn add dynamodb-datamodel
```

Require or import `Table` and `Model` from `dynamodb-datamodel`:

```javascript
const { Table, Model } = require('dynamodb-datamodel');
```

Create your Table and Model schema:

```javascript
const { Table, Model } = require('dynamodb-datamodel');
```
