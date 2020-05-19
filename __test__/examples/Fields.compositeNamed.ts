import { Fields, Model, Table, Update } from 'dynamodb-datamodel';
import { gsi0 } from './ExampleIndex';
import { table } from './ExampleTable';

// Create composite slots to use in model schema below.
const locMap = { neighborhood: 3, city: 2, state: 1, country: 0 };
const location = Fields.compositeNamed({
  alias: gsi0.getSortKey(),
  map: locMap,
  delimiter: ';',
});

export interface ModelIdKey {
  id: string;
}

// neighborhood, city, state and country only support simple set updates since they are part of a composite key
interface ModelItem extends ModelIdKey {
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  region: Update.String;
}

const locSlots = location.createNamedSlots();

// Define the schema using Fields
const model = Model.createModel<ModelIdKey, ModelItem>({
  schema: {
    id: Fields.split({ aliases: [table.getPartitionKey(), table.getSortKey()] }),
    neighborhood: locSlots.neighborhood,
    city: locSlots.city,
    state: locSlots.state,
    country: locSlots.country,
    region: Fields.string({ alias: gsi0.getPartitionKey() }),
  },
  table: table as Table,
});

const params = model.putParams({
  id: 'p1.s2',
  neighborhood: 'Birdland',
  city: 'Cupertino',
  state: 'CA',
  country: 'USA',
  region: 'NorthAmerica',
});

// test: value to expect
expect(params).toEqual({
  Item: { G0P: 'NorthAmerica', G0S: 'USA;CA;Cupertino;Birdland', P: 'p1', S: 's2' },
  TableName: 'ExampleTable',
});
