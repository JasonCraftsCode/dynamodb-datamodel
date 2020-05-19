import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Index, Table } from 'dynamodb-datamodel';
import { GSI0Key, gsi0, LSI0Key, lsi0 } from './ExampleIndex';

const client = new DocumentClient({ convertEmptyValues: true });

// Define the table primary key interface.
export interface TableKey {
  P: Table.PrimaryKey.PartitionString;
  S?: Table.PrimaryKey.SortString;
}

// Define the combined primary keys across the table and secondary indexes.
interface KeyAttributes extends TableKey, GSI0Key, LSI0Key {}

// Create the table object for the primary key and secondary indexes.
export const table = Table.createTable<TableKey, KeyAttributes>({
  client,
  name: 'ExampleTable',
  keyAttributes: {
    P: Table.PrimaryKey.StringType,
    S: Table.PrimaryKey.StringType,
    G0P: Table.PrimaryKey.StringType,
    G0S: Table.PrimaryKey.StringType,
    L0S: Table.PrimaryKey.NumberType,
  },
  keySchema: {
    P: Table.PrimaryKey.PartitionKeyType,
    S: Table.PrimaryKey.SortKeyType,
  },
  globalIndexes: [gsi0] as Index[],
  localIndexes: [lsi0] as Index[],
});
