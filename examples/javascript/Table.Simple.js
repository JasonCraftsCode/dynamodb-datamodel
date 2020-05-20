const { DocumentClient } = require('aws-sdk/clients/dynamodb');
const { Table } = require('dynamodb-datamodel');

const client = new DocumentClient({ convertEmptyValues: true });

// Create the table object for the primary key and secondary indexes.
const table = new Table({
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

const params = table.getParams({ P: 'p1', S: 's1' });

expect(params).toEqual({ Key: { P: 'p1', S: 's1' }, TableName: 'SimpleTable' });
