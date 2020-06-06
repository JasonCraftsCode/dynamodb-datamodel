import { Table } from '../src/Table';
import { Index } from '../src/TableIndex';
import { validateKeySchema, validateTable, validateIndex, validateIndexes } from '../src/TableValidate';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

it('Validate ValidateTable exports', () => {
  expect(typeof validateKeySchema).toEqual('function');
  expect(typeof validateTable).toEqual('function');
});

function getTestClient(): DocumentClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return {} as DocumentClient;
}
interface SimpleTableKey {
  P: Table.PrimaryKey.PartitionString;
  S?: Table.PrimaryKey.SortString;
}

interface SimpleKeyAttributes extends SimpleTableKey {
  G0P: Table.PrimaryKey.PartitionBinary;
  G0S?: Table.PrimaryKey.SortBinary;
  G1P: Table.PrimaryKey.PartitionNumber;
  G1S?: Table.PrimaryKey.SortNumber;
  L0S?: Table.PrimaryKey.SortBinary;
  L1S?: Table.PrimaryKey.SortNumber;
}

const testTableParams: Table.TableParamsT<SimpleTableKey, SimpleKeyAttributes> = {
  name: 'TestTable',
  keyAttributes: {
    P: Table.PrimaryKey.StringType,
    S: Table.PrimaryKey.StringType,
    G0P: Table.PrimaryKey.BinaryType,
    G0S: Table.PrimaryKey.BinaryType,
    G1P: Table.PrimaryKey.NumberType,
    G1S: Table.PrimaryKey.NumberType,
    L0S: Table.PrimaryKey.BinaryType,
    L1S: Table.PrimaryKey.NumberType,
  },
  keySchema: {
    P: Table.PrimaryKey.PartitionKeyType,
    S: Table.PrimaryKey.SortKeyType,
  },
  client: getTestClient(),
};

describe('When table', () => {
  it('has valid key attributes expect validateTable succeed', () => {
    const table = Table.createTable<SimpleTableKey, SimpleKeyAttributes>(testTableParams);
    expect(() => validateTable(table)).not.toThrow();
  });

  it('has only partition key expect validateTable succeed', () => {
    const table = Table.createTable<{ P: Table.PrimaryKey.PartitionString }>({
      name: 'TestTable',
      keyAttributes: { P: Table.PrimaryKey.StringType },
      keySchema: { P: Table.PrimaryKey.PartitionKeyType },
      client: getTestClient(),
    });
    expect(() => validateTable(table)).not.toThrow();
  });

  it('primary keys are string expect validateTable succeed', () => {
    const table = Table.createTable<{ P: Table.PrimaryKey.PartitionString; S?: Table.PrimaryKey.SortString }>({
      name: 'TestTable',
      keyAttributes: { P: Table.PrimaryKey.StringType, S: Table.PrimaryKey.StringType },
      keySchema: { P: Table.PrimaryKey.PartitionKeyType, S: Table.PrimaryKey.SortKeyType },
      client: getTestClient(),
    });
    expect(() => validateTable(table)).not.toThrow();
  });

  it('primary keys are numbers expect validateTable succeed', () => {
    const table = Table.createTable<{ P: Table.PrimaryKey.PartitionNumber; S?: Table.PrimaryKey.SortNumber }>({
      name: 'TestTable',
      keyAttributes: { P: Table.PrimaryKey.NumberType, S: Table.PrimaryKey.NumberType },
      keySchema: { P: Table.PrimaryKey.PartitionKeyType, S: Table.PrimaryKey.SortKeyType },
      client: getTestClient(),
    });
    expect(() => validateTable(table)).not.toThrow();
  });

  it('primary keys are binary expect validateTable succeed', () => {
    const table = Table.createTable<{ P: Table.PrimaryKey.PartitionBinary; S?: Table.PrimaryKey.SortBinary }>({
      name: 'TestTable',
      keyAttributes: { P: Table.PrimaryKey.BinaryType, S: Table.PrimaryKey.BinaryType },
      keySchema: { P: Table.PrimaryKey.PartitionKeyType, S: Table.PrimaryKey.SortKeyType },
      client: getTestClient(),
    });
    expect(() => validateTable(table)).not.toThrow();
  });

  it('missing name expect throw', () => {
    const table = Table.createTable<{ P: Table.PrimaryKey.PartitionString }>({
      name: '',
      keyAttributes: { P: Table.PrimaryKey.StringType },
      keySchema: { P: Table.PrimaryKey.PartitionKeyType },
      client: getTestClient(),
    });
    expect(() => validateTable(table)).toThrowError(new Error('Table must have a name'));
  });

  it('key attribute has invalid type expect throw', () => {
    const table = Table.createTable<{
      P: Table.PrimaryKey.PartitionString;
    }>({
      name: 'TestTable',
      keyAttributes: { P: { type: 'BOOL' as 'S' } },
      keySchema: { P: Table.PrimaryKey.PartitionKeyType },
      client: getTestClient(),
    });
    expect(() => validateTable(table)).toThrowError(
      new Error("Primary key 'P' has an invalid type of 'BOOL' in table 'TestTable'"),
    );
  });

  it('has more then one partition key expect throw', () => {
    const table = Table.createTable<{
      P: Table.PrimaryKey.PartitionString;
      P1: Table.PrimaryKey.PartitionString;
    }>({
      name: 'TestTable',
      keyAttributes: { P: Table.PrimaryKey.StringType, P1: Table.PrimaryKey.StringType },
      keySchema: { P: Table.PrimaryKey.PartitionKeyType, P1: Table.PrimaryKey.PartitionKeyType },
      client: getTestClient(),
    });
    expect(() => validateTable(table)).toThrowError(
      new Error("Key 'P1' invalid, TestTable already has partition key 'P'"),
    );
  });

  it('missing partition key expect throw', () => {
    const table = Table.createTable<{
      S: Table.PrimaryKey.SortString;
    }>({
      name: 'TestTable',
      keyAttributes: { S: Table.PrimaryKey.StringType },
      keySchema: { S: Table.PrimaryKey.SortKeyType },
      client: getTestClient(),
    });
    expect(() => validateTable(table)).toThrowError(new Error('TestTable needs partition key'));
  });

  it('partition key is not in table.keyAttributes expect throw', () => {
    // eslint-disable-next-line @typescript-eslint/ban-types
    const table = Table.createTable<{ P: Table.PrimaryKey.PartitionString }, {}>({
      name: 'TestTable',
      keyAttributes: {},
      keySchema: { P: Table.PrimaryKey.PartitionKeyType },
      client: getTestClient(),
    });
    expect(() => validateTable(table)).toThrowError(new Error("Key 'P' not in table's keyAttributes"));
  });

  it('has more then one sort key expect throw', () => {
    const table = Table.createTable<{
      P: Table.PrimaryKey.PartitionString;
      S?: Table.PrimaryKey.SortString;
      S1?: Table.PrimaryKey.SortString;
    }>({
      name: 'TestTable',
      keyAttributes: {
        P: Table.PrimaryKey.StringType,
        S: Table.PrimaryKey.StringType,
        S1: Table.PrimaryKey.StringType,
      },
      keySchema: {
        P: Table.PrimaryKey.PartitionKeyType,
        S: Table.PrimaryKey.SortKeyType,
        S1: Table.PrimaryKey.SortKeyType,
      },
      client: getTestClient(),
    });
    expect(() => validateTable(table)).toThrowError(new Error("Key 'S1' invalid, TestTable already has sort key 'S'"));
  });

  it('sort key is not in table.keyAttributes expect throw', () => {
    const table = Table.createTable<
      { P: Table.PrimaryKey.PartitionString; S: Table.PrimaryKey.SortString },
      { P: Table.PrimaryKey.PartitionString }
    >({
      name: 'TestTable',
      keyAttributes: { P: Table.PrimaryKey.StringType },
      keySchema: { P: Table.PrimaryKey.PartitionKeyType, S: Table.PrimaryKey.SortKeyType },
      client: getTestClient(),
    });
    expect(() => validateTable(table)).toThrowError(new Error("Key 'S' not in table's keyAttributes"));
  });

  it('partition key has invalid keyType expect throw', () => {
    const table = Table.createTable<{
      P: Table.PrimaryKey.PartitionString;
    }>({
      name: 'TestTable',
      keyAttributes: { P: Table.PrimaryKey.StringType },
      keySchema: { P: { keyType: 'PARTITION' as 'HASH' } },
      client: getTestClient(),
    });
    expect(() => validateTable(table)).toThrowError(new Error("Key 'P' has an invalid key type of 'PARTITION'"));
  });

  it('sort key has invalid keyType expect throw', () => {
    const table = Table.createTable<{
      P: Table.PrimaryKey.PartitionString;
      S: Table.PrimaryKey.SortString;
    }>({
      name: 'TestTable',
      keyAttributes: { P: Table.PrimaryKey.StringType, S: Table.PrimaryKey.StringType },
      keySchema: { P: Table.PrimaryKey.PartitionKeyType, S: { keyType: 'SORT' as 'RANGE' } },
      client: getTestClient(),
    });
    expect(() => validateTable(table)).toThrowError(new Error("Key 'S' has an invalid key type of 'SORT'"));
  });
});

function TestIndex<KEY>(
  keySchema: Table.PrimaryKey.KeyTypesMapT<KEY>,
  name = 'GSI0',
  table: Table,
  type: Index.Type,
): Index.IndexT<KEY> {
  return Index.createIndex<KEY>({
    name,
    keySchema,
    projection: {
      type: 'ALL',
    },
    table,
    type,
  });
}

describe('When global index', () => {
  const testTable = Table.createTable<SimpleTableKey, SimpleKeyAttributes>(testTableParams);

  function ProjectionIndex(projection: {
    type: Table.ProjectionType;
    attributes?: string[];
  }): Index.IndexT<{
    G0P: Table.PrimaryKey.PartitionString;
  }> {
    return Index.createIndex<{
      G0P: Table.PrimaryKey.PartitionString;
    }>({
      name: 'GSI',
      keySchema: { G0P: Table.PrimaryKey.PartitionKeyType },
      projection,
      table: testTable as Table,
      type: 'GLOBAL',
    });
  }

  it('missing name expect throw', () => {
    const gsi = ProjectionIndex({ type: 'ALL' });
    gsi.name = (undefined as unknown) as string;
    expect(() => validateIndex(gsi)).toThrowError(new Error('Global index must have a name'));
  });

  it('has validate ALL projection expect validateTable succeeds', () => {
    const gsi = ProjectionIndex({ type: 'ALL' });
    expect(() => validateIndex(gsi)).not.toThrow();
  });

  it('has validate KEYS_ONLY projection expect validateTable succeeds', () => {
    const gsi = ProjectionIndex({ type: 'KEYS_ONLY' });
    expect(() => validateIndex(gsi)).not.toThrow();
  });

  it('has validate INCLUDE projection expect validateTable succeeds', () => {
    const gsi = ProjectionIndex({ type: 'INCLUDE', attributes: ['attr1'] });
    expect(() => validateIndex(gsi)).not.toThrow();
  });

  it('has ALL projection that does not support attributes expect throw', () => {
    const gsi = ProjectionIndex({ type: 'ALL', attributes: ['attr'] });
    expect(() => validateIndex(gsi)).toThrowError(new Error("GSI' projection type 'ALL' does not support attributes"));
  });

  it('has KEYS_ONLY projection that does not support attributes expect throw', () => {
    const gsi = ProjectionIndex({ type: 'KEYS_ONLY', attributes: ['attr'] });
    expect(() => validateIndex(gsi)).toThrowError(
      new Error("GSI' projection type 'KEYS_ONLY' does not support attributes"),
    );
  });

  it('has invalidate projection type expect throw', () => {
    const gsi = ProjectionIndex({ type: 'PARTIAL' as 'KEYS_ONLY' });
    expect(() => validateIndex(gsi)).toThrowError(new Error("'GSI' projection type is invalidate 'PARTIAL'"));
  });

  it('has INCLUDE projection with no attributes expect throw', () => {
    const gsi = ProjectionIndex({ type: 'INCLUDE' });
    expect(() => validateIndex(gsi)).toThrowError(new Error("'GSI' projection type 'INCLUDE' must have attributes"));
  });

  it('has validate partition key expect validateIndex succeeds', () => {
    const gsi = TestIndex<{
      G0P: Table.PrimaryKey.PartitionString;
    }>({ G0P: Table.PrimaryKey.PartitionKeyType }, 'GSI0', testTable as Table, 'GLOBAL');
    expect(() => validateIndex(gsi)).not.toThrow();
  });

  it('has validate partition and sort keys expect validateTable succeeds', () => {
    const gsi = TestIndex<{
      G0P: Table.PrimaryKey.PartitionString;
      G0S: Table.PrimaryKey.SortString;
    }>(
      { G0P: Table.PrimaryKey.PartitionKeyType, G0S: Table.PrimaryKey.SortKeyType },
      'GSI0',
      testTable as Table,
      'GLOBAL',
    );
    expect(() => validateIndex(gsi)).not.toThrow();
  });

  it('partition and sort key same as table expect throw', () => {
    const gsi = TestIndex<{
      P: Table.PrimaryKey.PartitionString;
      S: Table.PrimaryKey.SortString;
    }>({ P: Table.PrimaryKey.PartitionKeyType, S: Table.PrimaryKey.SortKeyType }, 'GSI0', testTable as Table, 'GLOBAL');
    expect(() => validateIndex(gsi)).toThrowError(
      new Error("GSI0 has same partition key 'P' and sort key 'S' as table"),
    );
  });

  it('missing partition key expect throw', () => {
    const gsi = TestIndex<{
      S: Table.PrimaryKey.SortString;
    }>({ S: Table.PrimaryKey.SortKeyType }, 'GSI0', testTable as Table, 'GLOBAL');
    expect(() => validateIndex(gsi)).toThrowError(new Error('GSI0 needs partition key'));
  });

  it('partition key is not in table.keyAttributes expect throw', () => {
    const gsi = TestIndex<{
      Z0P: Table.PrimaryKey.PartitionString;
    }>({ Z0P: Table.PrimaryKey.PartitionKeyType }, 'GSI0', testTable as Table, 'GLOBAL');
    expect(() => validateIndex(gsi)).toThrowError(new Error("Key 'Z0P' not in table's keyAttributes"));
  });

  it('has more then one partition key expect throw', () => {
    const gsi = TestIndex<{
      G0P: Table.PrimaryKey.PartitionString;
      G1P: Table.PrimaryKey.PartitionString;
    }>(
      { G0P: Table.PrimaryKey.PartitionKeyType, G1P: Table.PrimaryKey.PartitionKeyType },
      'GSI0',
      testTable as Table,
      'GLOBAL',
    );
    expect(() => validateIndex(gsi)).toThrowError(new Error("Key 'G1P' invalid, GSI0 already has partition key 'G0P'"));
  });

  it('sort key is not in table.keyAttributes expect throw', () => {
    const gsi = TestIndex<{
      G0P: Table.PrimaryKey.PartitionString;
      Z0S: Table.PrimaryKey.SortString;
    }>(
      { G0P: Table.PrimaryKey.PartitionKeyType, Z0S: Table.PrimaryKey.SortKeyType },
      'GSI0',
      testTable as Table,
      'GLOBAL',
    );
    expect(() => validateIndex(gsi)).toThrowError(new Error("Key 'Z0S' not in table's keyAttributes"));
  });

  it('as more then one sort key expect throw', () => {
    const gsi = TestIndex<{
      G0P: Table.PrimaryKey.PartitionString;
      G0S: Table.PrimaryKey.SortString;
      G1S: Table.PrimaryKey.SortString;
    }>(
      {
        G0P: Table.PrimaryKey.PartitionKeyType,
        G0S: Table.PrimaryKey.SortKeyType,
        G1S: Table.PrimaryKey.SortKeyType,
      },
      'GSI0',
      testTable as Table,
      'GLOBAL',
    );
    expect(() => validateIndex(gsi)).toThrowError(new Error("Key 'G1S' invalid, GSI0 already has sort key 'G0S'"));
  });

  it('has same name expect throw', () => {
    const gsi0 = TestIndex<{ G0P: Table.PrimaryKey.PartitionString }>(
      { G0P: Table.PrimaryKey.PartitionKeyType },
      'GSI0',
      testTable as Table,
      'GLOBAL',
    );
    const gsi1 = TestIndex<{ G0P: Table.PrimaryKey.PartitionString }>(
      { G0P: Table.PrimaryKey.PartitionKeyType },
      'GSI0',
      testTable as Table,
      'GLOBAL',
    );
    expect(() => validateIndexes([gsi0, gsi1] as Index[])).toThrowError(new Error("Duplicate index name 'GSI0'"));
  });
});

describe('When local index', () => {
  const testTable = Table.createTable<SimpleTableKey, SimpleKeyAttributes>(testTableParams);

  it('has validate partition and sort keys expect validateTable succeeds', () => {
    const lsi = TestIndex<{
      P: Table.PrimaryKey.PartitionString;
      G0S: Table.PrimaryKey.SortString;
    }>(
      { P: Table.PrimaryKey.PartitionKeyType, G0S: Table.PrimaryKey.SortKeyType },
      'LSI0',
      testTable as Table,
      'LOCAL',
    );
    expect(() => validateIndex(lsi)).not.toThrow();
  });

  it('type is not validate expect throw', () => {
    const lsi = TestIndex<{ G0P: Table.PrimaryKey.PartitionString }>(
      { G0P: Table.PrimaryKey.PartitionKeyType },
      'LSI0',
      testTable as Table,
      'bad' as 'LOCAL',
    );
    expect(() => validateIndex(lsi)).toThrowError(new Error('LSI0 has invalid type: bad'));
  });

  it('partition key name is not same as table expect throw', () => {
    const lsi = TestIndex<{ G0P: Table.PrimaryKey.PartitionString }>(
      { G0P: Table.PrimaryKey.PartitionKeyType },
      'LSI0',
      testTable as Table,
      'LOCAL',
    );
    expect(() => validateIndex(lsi)).toThrowError(new Error("LSI0 partition key 'G0P' needs to be 'P'"));
  });

  it('as more then one partition key expect throw', () => {
    const lsi = TestIndex<{
      P: Table.PrimaryKey.PartitionString;
      G0P: Table.PrimaryKey.PartitionString;
    }>(
      { P: Table.PrimaryKey.PartitionKeyType, G0P: Table.PrimaryKey.PartitionKeyType },
      'LSI0',
      testTable as Table,
      'LOCAL',
    );
    expect(() => validateIndex(lsi)).toThrowError(new Error("Key 'G0P' invalid, LSI0 already has partition key 'P'"));
  });

  it('sort key must exist expect throw', () => {
    const lsi = TestIndex<{ P: Table.PrimaryKey.PartitionString }>(
      { P: Table.PrimaryKey.PartitionKeyType },
      'LSI0',
      testTable as Table,
      'LOCAL',
    );
    expect(() => validateIndex(lsi)).toThrowError(new Error('LSI0 must have a sort key'));
  });

  it('sort key is same as table expect throw', () => {
    const lsi = TestIndex<{
      P: Table.PrimaryKey.PartitionString;
      S: Table.PrimaryKey.SortString;
    }>({ P: Table.PrimaryKey.PartitionKeyType, S: Table.PrimaryKey.SortKeyType }, 'LSI0', testTable as Table, 'LOCAL');
    expect(() => validateIndex(lsi)).toThrowError(new Error("LSI0 has same sort key 'S' as table"));
  });

  it('sort key is not in table.keyAttributes expect throw', () => {
    const lsi = TestIndex<{
      P: Table.PrimaryKey.PartitionString;
      Z0S: Table.PrimaryKey.SortString;
    }>(
      { P: Table.PrimaryKey.PartitionKeyType, Z0S: Table.PrimaryKey.SortKeyType },
      'LSI0',
      testTable as Table,
      'LOCAL',
    );
    expect(() => validateIndex(lsi)).toThrowError(new Error("Key 'Z0S' not in table's keyAttributes"));
  });

  it('as more then one sort key expect throw', () => {
    const lsi = TestIndex<{
      P: Table.PrimaryKey.PartitionString;
      L0S: Table.PrimaryKey.SortString;
      L1S: Table.PrimaryKey.SortString;
    }>(
      { P: Table.PrimaryKey.PartitionKeyType, L0S: Table.PrimaryKey.SortKeyType, L1S: Table.PrimaryKey.SortKeyType },
      'LSI0',
      testTable as Table,
      'LOCAL',
    );
    expect(() => validateIndex(lsi)).toThrowError(new Error("Key 'L1S' invalid, LSI0 already has sort key 'L0S'"));
  });

  it('two local indexes have same name expect throw', () => {
    const lsi0 = TestIndex<{
      P: Table.PrimaryKey.PartitionString;
      L0S: Table.PrimaryKey.SortString;
    }>(
      { P: Table.PrimaryKey.PartitionKeyType, L0S: Table.PrimaryKey.SortKeyType },
      'LSI0',
      testTable as Table,
      'LOCAL',
    );
    const lsi1 = TestIndex<{
      P: Table.PrimaryKey.PartitionString;
      L1S: Table.PrimaryKey.SortString;
    }>(
      { P: Table.PrimaryKey.PartitionKeyType, L1S: Table.PrimaryKey.SortKeyType },
      'LSI0',
      testTable as Table,
      'LOCAL',
    );
    expect(() => validateIndexes([lsi0, lsi1])).toThrowError(new Error("Duplicate index name 'LSI0'"));
  });

  it('global and local has same name expect throw', () => {
    const lsi0 = TestIndex<{
      P: Table.PrimaryKey.PartitionString;
      L0S: Table.PrimaryKey.SortString;
    }>(
      { P: Table.PrimaryKey.PartitionKeyType, L0S: Table.PrimaryKey.SortKeyType },
      'LSI0',
      testTable as Table,
      'LOCAL',
    );
    const gsi0 = TestIndex<{
      G0P: Table.PrimaryKey.PartitionString;
      G0S: Table.PrimaryKey.SortString;
    }>(
      { G0P: Table.PrimaryKey.PartitionKeyType, G0S: Table.PrimaryKey.SortKeyType },
      'LSI0',
      testTable as Table,
      'GLOBAL',
    );
    expect(() => validateIndexes([gsi0, lsi0])).toThrowError(new Error("Duplicate index name 'LSI0'"));
  });
});
