import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Table } from 'dynamodb-datamodel';

export const client = new DocumentClient({ convertEmptyValues: true });

// Define the table primary key interface.
export interface TableKey {
  P: Table.PrimaryKey.PartitionString;
  S?: Table.PrimaryKey.SortString;
}

// Create the table object for the primary key and secondary indexes.
export const table = Table.createTable<TableKey>({
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

// Generate params to pass to DocumentClient or call the action method
const params = table.getParams({ P: 'p1', S: 's1' });

// (jest) output of getParams
expect(params).toEqual({ Key: { P: 'p1', S: 's1' }, TableName: 'SimpleTable' });
