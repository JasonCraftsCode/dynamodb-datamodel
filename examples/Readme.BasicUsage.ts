import { DocumentClient } from 'aws-sdk/clients/dynamodb';
// 1. Import or require `Table`, `Model` and `Fields` from `dynamodb-datamodel`
import { Table, Model, Fields } from 'dynamodb-datamodel';

// 2. Create DynamoDB DocumentClient
const client = new DocumentClient({ convertEmptyValues: true });

// 3. (TypeScript) Define Table's primary key
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

// 5. (TypeScript) Define each Model key and data interface
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
    id: Fields.split({ aliases: ['P', 'S'] }),
    name: Fields.string(),
  },
  table: table as Table, // 'as Table' needed for TypeScript
});

// Additional models can also be defined

// 7. Use the model to read and write data
export async function main(): Promise<void> {
  // Write item
  await model.put({ id: 'P-GUID.S-0', name: 'user name' });
  // Update item
  await model.update({ id: 'P-GUID.S-0', name: 'new user name' });
  // Get item
  await model.get({ id: 'P-GUID.S-0' });
  // Delete item
  await model.delete({ id: 'P-GUID.S-0' });
}
