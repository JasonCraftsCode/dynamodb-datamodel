import { Table, Index, IndexBase } from '../src/Table';
import { validateKeySchema, validateTable } from '../src/TableValidate';

it('Validate ValidateTable exports', () => {
  expect(typeof validateKeySchema).toEqual('function');
  expect(typeof validateTable).toEqual('function');
});

interface SimpleTableKey {
  P: Table.StringPartitionKey;
  S?: Table.StringSortKey;
}

interface SimpleKeyAttributes extends SimpleTableKey {
  G0P: Table.BinaryPartitionKey;
  G0S?: Table.BinarySortKey;
  G1P: Table.NumberPartitionKey;
  G1S?: Table.NumberSortKey;
  L0S?: Table.BinarySortKey;
  L1S?: Table.NumberSortKey;
}

const testTableParams: Table.TableParams<SimpleTableKey, SimpleKeyAttributes> = {
  name: 'TestTable',
  keyAttributes: {
    P: { type: 'S' },
    S: { type: 'S' },
    G0P: { type: 'B' },
    G0S: { type: 'B' },
    G1P: { type: 'N' },
    G1S: { type: 'N' },
    L0S: { type: 'B' },
    L1S: { type: 'N' },
  },
  keySchema: {
    P: { keyType: 'HASH' },
    S: { keyType: 'RANGE' },
  },
  client: {} as any,
};

function TestIndex<KEY>(keySchema: Table.PrimaryKeySchemaT<KEY>, name = 'GSI0') {
  return new Index<KEY>({
    name,
    keySchema,
    projection: {
      type: 'ALL',
    },
  });
}

describe('When table', () => {
  it('has valid key attributes expect validateTable succeed', () => {
    const table = new Table<SimpleTableKey, SimpleKeyAttributes>(testTableParams);
    expect(() => validateTable(table)).not.toThrow();
  });

  it('has only partition key expect validateTable succeed', () => {
    const table = new Table<{ P: Table.StringPartitionKey }>({
      name: 'TestTable',
      keyAttributes: { P: { type: 'S' } },
      keySchema: { P: { keyType: 'HASH' } },
      client: {} as any,
    });
    expect(() => validateTable(table)).not.toThrow();
  });

  it('primary keys are string expect validateTable succeed', () => {
    const table = new Table<{ P: Table.StringPartitionKey; S?: Table.StringSortKey }>({
      name: 'TestTable',
      keyAttributes: { P: { type: 'S' }, S: { type: 'S' } },
      keySchema: { P: { keyType: 'HASH' }, S: { keyType: 'RANGE' } },
      client: {} as any,
    });
    expect(() => validateTable(table)).not.toThrow();
  });

  it('primary keys are numbers expect validateTable succeed', () => {
    const table = new Table<{ P: Table.NumberPartitionKey; S?: Table.NumberSortKey }>({
      name: 'TestTable',
      keyAttributes: { P: { type: 'N' }, S: { type: 'N' } },
      keySchema: { P: { keyType: 'HASH' }, S: { keyType: 'RANGE' } },
      client: {} as any,
    });
    expect(() => validateTable(table)).not.toThrow();
  });

  it('primary keys are binary expect validateTable succeed', () => {
    const table = new Table<{ P: Table.BinaryPartitionKey; S?: Table.BinarySortKey }>({
      name: 'TestTable',
      keyAttributes: { P: { type: 'B' }, S: { type: 'B' } },
      keySchema: { P: { keyType: 'HASH' }, S: { keyType: 'RANGE' } },
      client: {} as any,
    });
    expect(() => validateTable(table)).not.toThrow();
  });

  it('missing name expect throw', () => {
    const table = new Table<{ P: Table.StringPartitionKey }>({
      name: '',
      keyAttributes: { P: { type: 'S' } },
      keySchema: { P: { keyType: 'HASH' } },
      client: {} as any,
    });
    expect(() => validateTable(table)).toThrowError(new Error('Table must have a name'));
  });

  it('key attribute has invalid type expect throw', () => {
    const table = new Table<{
      P: Table.StringPartitionKey;
    }>({
      name: 'TestTable',
      keyAttributes: { P: { type: 'BOOL' } as any },
      keySchema: { P: { keyType: 'HASH' } },
      client: {} as any,
    });
    expect(() => validateTable(table)).toThrowError(
      new Error("Primary key 'P' has an invalid type of 'BOOL' in table 'TestTable'"),
    );
  });

  it('has more then one partitation key expect throw', () => {
    const table = new Table<{
      P: Table.StringPartitionKey;
      P1: Table.StringPartitionKey;
    }>({
      name: 'TestTable',
      keyAttributes: { P: { type: 'S' }, P1: { type: 'S' } },
      keySchema: { P: { keyType: 'HASH' }, P1: { keyType: 'HASH' } },
      client: {} as any,
    });
    expect(() => validateTable(table)).toThrowError(
      new Error("Key 'P1' invalid, TestTable already has partition key 'P'"),
    );
  });

  it('missing partition key expect throw', () => {
    const table = new Table<{
      S: Table.StringSortKey;
    }>({
      name: 'TestTable',
      keyAttributes: { S: { type: 'S' } },
      keySchema: { S: { keyType: 'RANGE' } },
      client: {} as any,
    });
    expect(() => validateTable(table)).toThrowError(new Error('TestTable needs partition key'));
  });

  it('partition key is not in table.keyAttributes expect throw', () => {
    const table = new Table<{ P: Table.StringPartitionKey }, {}>({
      name: 'TestTable',
      keyAttributes: {},
      keySchema: { P: { keyType: 'HASH' } },
      client: {} as any,
    });
    expect(() => validateTable(table)).toThrowError(new Error("Key 'P' not in table's keyAttributes"));
  });

  it('has more then one sort key expect throw', () => {
    const table = new Table<{
      P: Table.StringPartitionKey;
      S?: Table.StringSortKey;
      S1?: Table.StringSortKey;
    }>({
      name: 'TestTable',
      keyAttributes: { P: { type: 'S' }, S: { type: 'S' }, S1: { type: 'S' } },
      keySchema: { P: { keyType: 'HASH' }, S: { keyType: 'RANGE' }, S1: { keyType: 'RANGE' } },
      client: {} as any,
    });
    expect(() => validateTable(table)).toThrowError(new Error("Key 'S1' invalid, TestTable already has sort key 'S'"));
  });

  it('sort key is not in table.keyAttributes expect throw', () => {
    const table = new Table<{ P: Table.StringPartitionKey; S: Table.StringSortKey }, { P: Table.StringPartitionKey }>({
      name: 'TestTable',
      keyAttributes: { P: { type: 'S' } },
      keySchema: { P: { keyType: 'HASH' }, S: { keyType: 'RANGE' } },
      client: {} as any,
    });
    expect(() => validateTable(table)).toThrowError(new Error("Key 'S' not in table's keyAttributes"));
  });

  it('partition key has invalid keyType expect throw', () => {
    const table = new Table<{
      P: Table.StringPartitionKey;
    }>({
      name: 'TestTable',
      keyAttributes: { P: { type: 'S' } },
      keySchema: { P: { keyType: 'PARTITION' } as any },
      client: {} as any,
    });
    expect(() => validateTable(table)).toThrowError(new Error("Key 'P' has an invalid key type of 'PARTITION'"));
  });

  it('sort key has invalid keyType expect throw', () => {
    const table = new Table<{
      P: Table.StringPartitionKey;
      S: Table.StringSortKey;
    }>({
      name: 'TestTable',
      keyAttributes: { P: { type: 'S' }, S: { type: 'S' } },
      keySchema: { P: { keyType: 'HASH' }, S: { keyType: 'SORT' } as any },
      client: {} as any,
    });
    expect(() => validateTable(table)).toThrowError(new Error("Key 'S' has an invalid key type of 'SORT'"));
  });
});

describe('When global index', () => {
  const testTable = new Table<SimpleTableKey, SimpleKeyAttributes>(testTableParams);
  beforeAll(() => {
    testTable.globalIndexes = [];
    testTable.localIndexes = [];
  });

  function ProjectionIndex(projection: { type: Table.ProjectionType; attributes?: string[] }) {
    return new Index<{
      G0P: Table.StringPartitionKey;
    }>({
      name: 'GSI',
      keySchema: { G0P: { keyType: 'HASH' } },
      projection,
    });
  }

  it('missing name expect throw', () => {
    const gsi = ProjectionIndex({ type: 'ALL' });
    gsi.name = '';
    testTable.globalIndexes = [gsi as IndexBase];
    expect(() => validateTable(testTable)).toThrowError(new Error('Global index must have a name'));
  });

  it('has validate ALL projection expect validateTable succeeds', () => {
    const gsi = ProjectionIndex({ type: 'ALL' });
    testTable.globalIndexes = [gsi as IndexBase];
    expect(() => validateTable(testTable)).not.toThrow();
  });

  it('has validate KEYS_ONLY projection expect validateTable succeeds', () => {
    const gsi = ProjectionIndex({ type: 'KEYS_ONLY' });
    testTable.globalIndexes = [gsi as IndexBase];
    expect(() => validateTable(testTable)).not.toThrow();
  });

  it('has validate INCLUDE projection expect validateTable succeeds', () => {
    const gsi = ProjectionIndex({ type: 'INCLUDE', attributes: ['attr1'] });
    testTable.globalIndexes = [gsi as IndexBase];
    expect(() => validateTable(testTable)).not.toThrow();
  });

  it('has ALL projection that does not support attributes expect throw', () => {
    const gsi = ProjectionIndex({ type: 'ALL', attributes: ['attr'] });
    testTable.globalIndexes = [gsi as IndexBase];
    expect(() => validateTable(testTable)).toThrowError(
      new Error("GSI' projection type 'ALL' does not support attributes"),
    );
  });

  it('has KEYS_ONLY projection that does not support attributes expect throw', () => {
    const gsi = ProjectionIndex({ type: 'KEYS_ONLY', attributes: ['attr'] });
    testTable.globalIndexes = [gsi as IndexBase];
    expect(() => validateTable(testTable)).toThrowError(
      new Error("GSI' projection type 'KEYS_ONLY' does not support attributes"),
    );
  });

  it('has invalidate projection type expect throw', () => {
    const gsi = ProjectionIndex({ type: 'PARTIAL' } as any);
    testTable.globalIndexes = [gsi as IndexBase];
    expect(() => validateTable(testTable)).toThrowError(new Error("'GSI' projection type is invalidate 'PARTIAL'"));
  });

  it('has INCLUDE projection with no attributes expect throw', () => {
    const gsi = ProjectionIndex({ type: 'INCLUDE' });
    testTable.globalIndexes = [gsi as IndexBase];
    expect(() => validateTable(testTable)).toThrowError(
      new Error("'GSI' projection type 'INCLUDE' must have attributes"),
    );
  });

  it('has validate partition key expect validateTable succeeds', () => {
    const gsi = TestIndex<{
      G0P: Table.StringPartitionKey;
    }>({ G0P: { keyType: 'HASH' } });
    testTable.globalIndexes = [gsi as IndexBase];
    expect(() => validateTable(testTable)).not.toThrow();
  });

  it('has validate parition and sort keys expect validateTable succeeds', () => {
    const gsi = TestIndex<{
      G0P: Table.StringPartitionKey;
      G0S: Table.StringSortKey;
    }>({ G0P: { keyType: 'HASH' }, G0S: { keyType: 'RANGE' } });
    testTable.globalIndexes = [gsi as IndexBase];
    expect(() => validateTable(testTable)).not.toThrow();
  });

  it('partition and sort key same as table expect throw', () => {
    const gsi = TestIndex<{
      P: Table.StringPartitionKey;
      S: Table.StringSortKey;
    }>({ P: { keyType: 'HASH' }, S: { keyType: 'RANGE' } });
    testTable.globalIndexes = [gsi as IndexBase];
    expect(() => validateTable(testTable)).toThrowError(
      new Error("GSI0 has same partition key 'P' and sort key 'S' as table"),
    );
  });

  it('missing partition key expect throw', () => {
    const gsi = TestIndex<{
      S: Table.StringSortKey;
    }>({ S: { keyType: 'RANGE' } });
    testTable.globalIndexes = [gsi as IndexBase];
    expect(() => validateTable(testTable)).toThrowError(new Error('GSI0 needs partition key'));
  });

  it('partition key is not in table.keyAttributes expect throw', () => {
    const gsi = TestIndex<{
      Z0P: Table.StringPartitionKey;
    }>({ Z0P: { keyType: 'HASH' } });
    testTable.globalIndexes = [gsi as IndexBase];
    expect(() => validateTable(testTable)).toThrowError(new Error("Key 'Z0P' not in table's keyAttributes"));
  });

  it('has more then one partitation key expect throw', () => {
    const gsi = TestIndex<{
      G0P: Table.StringPartitionKey;
      G1P: Table.StringPartitionKey;
    }>({ G0P: { keyType: 'HASH' }, G1P: { keyType: 'HASH' } });
    testTable.globalIndexes = [gsi as IndexBase];
    expect(() => validateTable(testTable)).toThrowError(
      new Error("Key 'G1P' invalid, GSI0 already has partition key 'G0P'"),
    );
  });

  it('sort key is not in table.keyAttributes expect throw', () => {
    const gsi = TestIndex<{
      G0P: Table.StringPartitionKey;
      Z0S: Table.StringSortKey;
    }>({ G0P: { keyType: 'HASH' }, Z0S: { keyType: 'RANGE' } });
    testTable.globalIndexes = [gsi as IndexBase];
    expect(() => validateTable(testTable)).toThrowError(new Error("Key 'Z0S' not in table's keyAttributes"));
  });

  it('as more then one sort key expect throw', () => {
    const gsi = TestIndex<{
      G0P: Table.StringPartitionKey;
      G0S: Table.StringSortKey;
      G1S: Table.StringSortKey;
    }>({ G0P: { keyType: 'HASH' }, G0S: { keyType: 'RANGE' }, G1S: { keyType: 'RANGE' } });
    testTable.globalIndexes = [gsi as IndexBase];
    expect(() => validateTable(testTable)).toThrowError(
      new Error("Key 'G1S' invalid, GSI0 already has sort key 'G0S'"),
    );
  });

  it('has same name expect throw', () => {
    const gsi0 = TestIndex<{ G0P: Table.StringPartitionKey }>({ G0P: { keyType: 'HASH' } });
    const gsi1 = TestIndex<{ G0P: Table.StringPartitionKey }>({ G0P: { keyType: 'HASH' } });
    testTable.globalIndexes = [gsi0, gsi1] as IndexBase[];
    expect(() => validateTable(testTable)).toThrowError(new Error("Duplicate index name 'GSI0'"));
  });
});

describe('When local index', () => {
  const testTable = new Table<SimpleTableKey, SimpleKeyAttributes>(testTableParams);
  beforeAll(() => {
    testTable.globalIndexes = [];
    testTable.localIndexes = [];
  });

  it('has validate parition and sort keys expect validateTable succeeds', () => {
    const lsi = TestIndex<{
      P: Table.StringPartitionKey;
      G0S: Table.StringSortKey;
    }>({ P: { keyType: 'HASH' }, G0S: { keyType: 'RANGE' } });
    testTable.localIndexes = [lsi as IndexBase];
    expect(() => validateTable(testTable)).not.toThrow();
  });

  it('partition key name is not same as table expect throw', () => {
    const lsi = TestIndex<{ G0P: Table.StringPartitionKey }>({ G0P: { keyType: 'HASH' } });
    testTable.localIndexes = [lsi] as IndexBase[];
    expect(() => validateTable(testTable)).toThrowError(new Error("GSI0 partition key 'G0P' needs to be 'P'"));
  });

  it('as more then one partitation key expect throw', () => {
    const gsi = TestIndex<{
      P: Table.StringPartitionKey;
      G0P: Table.StringPartitionKey;
    }>({ P: { keyType: 'HASH' }, G0P: { keyType: 'HASH' } });
    testTable.localIndexes = [gsi as IndexBase];
    expect(() => validateTable(testTable)).toThrowError(
      new Error("Key 'G0P' invalid, GSI0 already has partition key 'P'"),
    );
  });

  it('sort key must exist expect throw', () => {
    const lsi = TestIndex<{ P: Table.StringPartitionKey }>({ P: { keyType: 'HASH' } });
    testTable.localIndexes = [lsi] as IndexBase[];
    expect(() => validateTable(testTable)).toThrowError(new Error('GSI0 must have a sort key'));
  });

  it('sort key is same as table expect throw', () => {
    const lsi = TestIndex<{
      P: Table.StringPartitionKey;
      S: Table.StringSortKey;
    }>({ P: { keyType: 'HASH' }, S: { keyType: 'RANGE' } });
    testTable.localIndexes = [lsi] as IndexBase[];
    expect(() => validateTable(testTable)).toThrowError(new Error("GSI0 has same sort key 'S' as table"));
  });

  it('sort key is not in table.keyAttributes expect throw', () => {
    const lsi = TestIndex<{
      P: Table.StringPartitionKey;
      Z0S: Table.StringSortKey;
    }>({ P: { keyType: 'HASH' }, Z0S: { keyType: 'RANGE' } });
    testTable.localIndexes = [lsi as IndexBase];
    expect(() => validateTable(testTable)).toThrowError(new Error("Key 'Z0S' not in table's keyAttributes"));
  });

  it('as more then one sort key expect throw', () => {
    const lsi = TestIndex<{
      P: Table.StringPartitionKey;
      L0S: Table.StringSortKey;
      L1S: Table.StringSortKey;
    }>({ P: { keyType: 'HASH' }, L0S: { keyType: 'RANGE' }, L1S: { keyType: 'RANGE' } });
    testTable.localIndexes = [lsi as IndexBase];
    expect(() => validateTable(testTable)).toThrowError(
      new Error("Key 'L1S' invalid, GSI0 already has sort key 'L0S'"),
    );
  });

  it('has same name expect throw', () => {
    const lsi0 = TestIndex<{
      P: Table.StringPartitionKey;
      L0S: Table.StringSortKey;
    }>({ P: { keyType: 'HASH' }, L0S: { keyType: 'RANGE' } });
    const lsi1 = TestIndex<{
      P: Table.StringPartitionKey;
      L1S: Table.StringSortKey;
    }>({ P: { keyType: 'HASH' }, L1S: { keyType: 'RANGE' } });
    testTable.localIndexes = [lsi0, lsi1] as IndexBase[];
    expect(() => validateTable(testTable)).toThrowError(new Error("Duplicate index name 'GSI0'"));
  });

  it('has same name expect throw', () => {
    const lsi0 = TestIndex<{
      P: Table.StringPartitionKey;
      L0S: Table.StringSortKey;
    }>({ P: { keyType: 'HASH' }, L0S: { keyType: 'RANGE' } });
    const gsi0 = TestIndex<{
      G0P: Table.StringPartitionKey;
      G0S: Table.StringSortKey;
    }>({ G0P: { keyType: 'HASH' }, G0S: { keyType: 'RANGE' } });
    testTable.globalIndexes = [gsi0] as IndexBase[];
    testTable.localIndexes = [lsi0] as IndexBase[];
    expect(() => validateTable(testTable)).toThrowError(new Error("Duplicate index name 'GSI0'"));
  });
});
