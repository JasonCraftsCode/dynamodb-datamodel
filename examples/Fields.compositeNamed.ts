import { Fields, Model, Table, Update } from 'dynamodb-datamodel';
import { table, gsi0 } from './Table';

// Create composite slots to use in model schema below.
const locMap = { neighborhood: 3, city: 2, state: 1, country: 0 };
const location = Fields.compositeNamed({
  alias: gsi0.getSortKey(),
  map: locMap,
  delimiter: ';',
});

interface ModelIdKey {
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
  id: 'P-1.S-2',
  neighborhood: 'Birdland',
  city: 'Cupertino',
  state: 'CA',
  country: 'USA',
  region: 'NorthAmerica',
});

// test: value to expect
expect(params).toEqual({
  Item: { G0P: 'NorthAmerica', G0S: 'USA;CA;Cupertino;Birdland', P: 'P-1', S: 'S-2' },
  TableName: 'ExampleTable',
});
