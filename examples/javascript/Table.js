const { DocumentClient } = require('aws-sdk/clients/dynamodb');
const { Table } = require('dynamodb-datamodel');
const { gsi0, lsi0 } = require('./Index');

const client = new DocumentClient({ convertEmptyValues: true });
exports.client = client;

// Create the table object with global and local secondary indexes.
// name, keyAttributes and keySchema should match the DynamoDB's table CloudFormation resource.
exports.table = new Table({
  client,
  name: 'ExampleTable',
  // Defines the attribute type ('S', 'N', 'B') for all primary keys, table and indexes.
  keyAttributes: {
    P: Table.PrimaryKey.StringType,
    S: Table.PrimaryKey.StringType,
    G0P: Table.PrimaryKey.StringType,
    G0S: Table.PrimaryKey.StringType,
    L0S: Table.PrimaryKey.NumberType,
  },
  // Defines the key type ('HASH' or 'RANGE') for the table primary keys.
  keySchema: {
    P: Table.PrimaryKey.PartitionKeyType,
    S: Table.PrimaryKey.SortKeyType,
  },
});

// export from here to consolidate imports
exports.gsi0 = gsi0;
exports.lsi0 = lsi0;
