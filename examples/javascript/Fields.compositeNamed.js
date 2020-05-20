const { Fields, Model } = require('dynamodb-datamodel');
const { table, gsi0 } = require('./Table');

// Create composite slots to use in model schema below.
const locMap = { neighborhood: 3, city: 2, state: 1, country: 0 };
const location = Fields.compositeNamed({
  alias: gsi0.getSortKey(),
  map: locMap,
  delimiter: ';',
});

const locSlots = location.createNamedSlots();

// Define the schema using Fields
const model = new Model({
  schema: {
    id: Fields.split({ aliases: [table.getPartitionKey(), table.getSortKey()] }),
    neighborhood: locSlots.neighborhood,
    city: locSlots.city,
    state: locSlots.state,
    country: locSlots.country,
    region: Fields.string({ alias: gsi0.getPartitionKey() }),
  },
  table: table,
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
