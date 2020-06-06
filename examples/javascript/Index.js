const { Index, Table } = require('dynamodb-datamodel');
const { table } = require('./Table');

// Create an Index object for GSI0 based on GSI0Key, and project all attributes.
const gsi0 = new Index({
  name: 'GSI0',
  // Defines the key type ('HASH' or 'RANGE') for the GSI primary keys.
  keySchema: {
    G0P: Table.PrimaryKey.PartitionKeyType,
    G0S: Table.PrimaryKey.SortKeyType,
  },
  projection: { type: 'ALL' },
  table,
  type: 'GLOBAL',
});
exports.gsi0 = gsi0;

// Create an Index object for LSI0 based on LSI0Key, and project all attributes.
exports.lsi0 = new Index({
  name: 'LSI0',
  // Defines the key type ('HASH' or 'RANGE') for the LSI primary keys, partition key must be same as the table's
  keySchema: {
    P: Table.PrimaryKey.PartitionKeyType,
    L0S: Table.PrimaryKey.SortKeyType,
  },
  projection: { type: 'ALL' },
  table,
  type: 'LOCAL',
});
