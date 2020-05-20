import { Index, Table } from 'dynamodb-datamodel';

// Define a Global Secondary Index (GSI) key interface for GSI0.
export interface GSI0Key {
  G0P: Table.PrimaryKey.PartitionString;
  G0S?: Table.PrimaryKey.SortString;
}

// Create an Index object for GSI0 based on GSI0Key, and project all attributes.
export const gsi0 = Index.createIndex<GSI0Key>({
  name: 'GSI0',
  // Defines the key type ('HASH' or 'RANGE') for the GSI primary keys.
  keySchema: {
    G0P: Table.PrimaryKey.PartitionKeyType,
    G0S: Table.PrimaryKey.SortKeyType,
  },
  projection: { type: 'ALL' },
});

// Define a Local Secondary Index (LSI) key interface for LSI0, partition key must be same as the table's
export interface LSI0Key {
  P: Table.PrimaryKey.PartitionString;
  L0S?: Table.PrimaryKey.SortNumber;
}

// Create an Index object for LSI0 based on LSI0Key, and project all attributes.
export const lsi0 = Index.createIndex<LSI0Key>({
  name: 'LSI0',
  // Defines the key type ('HASH' or 'RANGE') for the LSI primary keys.
  keySchema: {
    P: Table.PrimaryKey.PartitionKeyType,
    L0S: Table.PrimaryKey.SortKeyType,
  },
  projection: { type: 'ALL' },
});
