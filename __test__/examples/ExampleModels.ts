import { Fields, Model, Table, Update } from 'dynamodb-datamodel';
import { gsi0 } from './ExampleIndex';
import { table } from './ExampleTable';

// Common id based model key used for most models
export interface ModelIdKey {
  id: string;
}

// Common field for id based model key
export const idField = (): Fields.FieldSplit =>
  Fields.split({ aliases: [table.getPartitionKey(), table.getSortKey()] });

// Add each field here

// Composite field used for location based on GSI0
// TODO: composite fields should also support dependent fields, like 'region: gsi0.getPartitionKey()'
//   dependency field could also be something that is already in use like table partition or sort key.
//   The reason to add it to the composite key is to error if not present on put.
const locationField = Fields.compositeNamed({
  alias: gsi0.getSortKey(),
  map: { street: 0, city: 1, state: 2, country: 3 },
  delimiter: ';',
});

// street, city, state and country only support simple set updates since
// they are part of a composite key
export interface ModelItem extends ModelIdKey {
  street: string;
  city: string;
  state: string;
  country: string;
  region: Update.String;
}

// Create composite slots to use in model schema below.
const locSlots = locationField.createNamedSlots();

export const schema: Model.ModelSchemaT<ModelItem> = {
  id: idField(),
  street: locSlots.street,
  city: locSlots.city,
  state: locSlots.state,
  country: locSlots.country,
  region: Fields.string({ alias: gsi0.getPartitionKey() }),
};

// Define the schema using Fields
export const model = Model.createModel<ModelIdKey, ModelItem>({
  schema,
  table: table as Table,
});
