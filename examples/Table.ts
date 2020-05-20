import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Index, Table } from 'dynamodb-datamodel';
import { GSI0Key, gsi0, LSI0Key, lsi0 } from './Index';
export { GSI0Key, gsi0, LSI0Key, lsi0 }; // export from here to consolidate imports

// Good practice to covert empty values to null
export const client = new DocumentClient({ convertEmptyValues: true });

// Define the table primary key interface.
export interface TableKey {
  P: Table.PrimaryKey.PartitionString;
  S?: Table.PrimaryKey.SortString;
}

// Define the combined primary keys across the table and secondary indexes.
interface KeyAttributes extends TableKey, GSI0Key, LSI0Key {}

// Create the table object with global and local secondary indexes.
// name, keyAttributes and keySchema should match the DynamoDB's table CloudFormation resource.
export const table = Table.createTable<TableKey, KeyAttributes>({
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
  globalIndexes: [gsi0] as Index[],
  localIndexes: [lsi0] as Index[],
});
