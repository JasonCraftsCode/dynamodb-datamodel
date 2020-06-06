/* eslint-disable @typescript-eslint/unbound-method */
import { AWSError, Request } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

import { Table } from '../src/Table';
import { Index } from '../src/TableIndex';
import { validateTable } from '../src/TableValidate';
import { delay } from './testCommon';

const client = new DocumentClient({ convertEmptyValues: true });
const request = {
  promise() {
    return delay(1, { Attributes: {} });
  },
} as Request<DocumentClient.GetItemOutput, AWSError>;

it('Validate Index exports', () => {
  expect(typeof Index.createIndex).toBe('function');
});

describe('Validate indexes', () => {
  interface TestTableKey {
    P: Table.PrimaryKey.PartitionString;
    S?: Table.PrimaryKey.SortString;
  }

  const testTable = Table.createTable<TestTableKey, TestTableAttributes>({
    name: 'TestTable',
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
    client,
  });

  interface GSI0Key {
    G0P: Table.PrimaryKey.PartitionString;
    G0S?: Table.PrimaryKey.SortString;
  }

  interface LSI0Key {
    P: Table.PrimaryKey.PartitionString;
    L0S?: Table.PrimaryKey.SortNumber;
  }

  interface TestTableAttributes extends TestTableKey, GSI0Key, LSI0Key {}

  const gsi0 = Index.createIndex<GSI0Key>({
    name: 'GSI0',
    keySchema: {
      G0P: Table.PrimaryKey.PartitionKeyType,
      G0S: Table.PrimaryKey.SortKeyType,
    },
    projection: {
      type: 'ALL',
    },
    table: testTable as Table,
    type: 'GLOBAL',
  });
  /*
  const lsi0 = Index.createIndex<LSI0Key>({
    name: 'LSI0',
    keySchema: {
      P: Table.PrimaryKey.PartitionKeyType,
      L0S: Table.PrimaryKey.SortKeyType,
    },
    projection: {
      attributes: ['project', 'some', 'attributes'],
      type: 'INCLUDE',
    },
    table: testTable as Table,
    type: 'GLOBAL',
  });
*/
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Table with Index', () => {
    expect(() => validateTable(testTable)).not.toThrow();
  });

  it('Index.getPartitionKey', () => {
    expect(gsi0.getPartitionKey()).toEqual('G0P');
  });

  it('Index.getSortKey', () => {
    expect(gsi0.getSortKey()).toEqual('G0S');
  });

  it('gsi queryParams with P', () => {
    const params = gsi0.queryParams({ G0P: 'mno' });
    expect(params).toEqual({
      ExpressionAttributeNames: { '#n0': 'G0P' },
      ExpressionAttributeValues: { ':v0': 'mno' },
      IndexName: 'GSI0',
      KeyConditionExpression: '#n0 = :v0',
      TableName: 'TestTable',
    });
  });

  it('gsi queryParams with G0P and G0S', () => {
    const params = gsi0.queryParams({ G0P: 'mno', G0S: '123' });
    expect(params).toEqual({
      ExpressionAttributeNames: { '#n0': 'G0P', '#n1': 'G0S' },
      ExpressionAttributeValues: { ':v0': 'mno', ':v1': '123' },
      IndexName: 'GSI0',
      KeyConditionExpression: '#n0 = :v0 AND #n1 = :v1',
      TableName: 'TestTable',
    });
  });

  it('gsi query', async () => {
    client.query = jest.fn(() => request);
    const results = await gsi0.query({ G0P: 'zyx', G0S: '321' });
    expect(results).toEqual({ Attributes: {} });
    expect(client.query).toBeCalledWith({
      ExpressionAttributeNames: { '#n0': 'G0P', '#n1': 'G0S' },
      ExpressionAttributeValues: { ':v0': 'zyx', ':v1': '321' },
      IndexName: 'GSI0',
      KeyConditionExpression: '#n0 = :v0 AND #n1 = :v1',
      TableName: 'TestTable',
    });
    expect(client.query).toBeCalledTimes(1);
  });

  it('gsi scanParams', () => {
    const params = gsi0.scanParams();
    expect(params).toEqual({
      IndexName: 'GSI0',
      TableName: 'TestTable',
    });
  });

  it('gsi scan', async () => {
    client.scan = jest.fn(() => request);
    const results = await gsi0.scan();
    expect(results).toEqual({ Attributes: {} });
    expect(client.scan).toBeCalledWith({
      IndexName: 'GSI0',
      TableName: 'TestTable',
    });
    expect(client.scan).toBeCalledTimes(1);
  });
});
