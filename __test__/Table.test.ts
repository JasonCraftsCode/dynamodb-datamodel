import { AWSError, Request } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

import { Table, Index, IndexBase } from '../src/Table';
import { validateTable } from '../src/ValidateTable';
import { delay } from './testCommon';

const client = new DocumentClient();
const request = {
  promise() {
    return delay(1, { Attributes: {} });
  },
} as Request<DocumentClient.GetItemOutput, AWSError>;

it('Validate Table exports', () => {
  expect(typeof Table).toBe('function');
  expect(typeof Index).toBe('function');
  expect(typeof validateTable).toBe('function');
});

describe('Validate Simple Table', () => {
  interface SimpleTableKey {
    P: Table.StringPartitionKey;
    S?: Table.StringSortKey;
  }

  const testTable = new Table<SimpleTableKey, SimpleTableKey>({
    name: 'TestTable',
    keyAttributes: {
      P: { type: Table.PrimaryAttributeType.String },
      S: { type: Table.PrimaryAttributeType.String },
    },
    keySchema: {
      P: { keyType: Table.PrimaryKeyType.Hash },
      S: { keyType: Table.PrimaryKeyType.Range },
    },
    client,
  });

  it('validateTable', () => {
    validateTable(testTable);
  });

  it('queryParams with P', () => {
    const params = testTable.queryParams({ P: 'abc' });
    expect(params).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 'abc' },
      KeyConditionExpression: '#n0 = :v0',
      TableName: 'TestTable',
    });
  });

  it('queryParams with P and S', () => {
    const params = testTable.queryParams({ P: 'abc', S: 'def' });
    expect(params).toEqual({
      ExpressionAttributeNames: {
        '#n0': 'P',
        '#n1': 'S',
      },
      ExpressionAttributeValues: {
        ':v0': 'abc',
        ':v1': 'def',
      },
      KeyConditionExpression: '#n0 = :v0 AND #n1 = :v1',
      TableName: 'TestTable',
    });
  });

  it('query', async () => {
    client.query = jest.fn((params) => request);
    const results = await testTable.query({ P: 'xyz' });
    expect(results).toEqual({ Attributes: {} });
    expect(client.query).toBeCalledWith({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 'xyz' },
      KeyConditionExpression: '#n0 = :v0',
      TableName: 'TestTable',
    });
    expect(client.query).toBeCalledTimes(1);
  });

  it('scanParams', () => {
    const params = testTable.scanParams();
    expect(params).toEqual({
      TableName: 'TestTable',
    });
  });

  it('scan', async () => {
    client.scan = jest.fn((params) => request);
    const results = await testTable.scan();
    expect(results).toEqual({ Attributes: {} });
    expect(client.scan).toBeCalledWith({
      TableName: 'TestTable',
    });
    expect(client.scan).toBeCalledTimes(1);
  });
});

describe('Validate Table with indexes', () => {
  interface TestTableKey {
    P: Table.StringPartitionKey;
    S?: Table.StringSortKey;
  }

  interface GSI0Key {
    G0P: Table.StringPartitionKey;
    G0S?: Table.StringSortKey;
  }

  interface LSI0Key {
    P: Table.StringPartitionKey;
    L0S?: Table.NumberSortKey;
  }

  interface TestTableAttributes extends TestTableKey, GSI0Key, LSI0Key {}

  const gsi0 = new Index<GSI0Key>({
    name: 'GSI0',
    keySchema: {
      G0P: { keyType: Table.PrimaryKeyType.Hash },
      G0S: { keyType: Table.PrimaryKeyType.Range },
    },
    projection: {
      type: Table.ProjectionType.All,
    },
  });

  const lsi0 = new Index<LSI0Key>({
    name: 'LSI0',
    keySchema: {
      P: { keyType: Table.PrimaryKeyType.Hash },
      L0S: { keyType: Table.PrimaryKeyType.Range },
    },
    projection: {
      attributes: ['project', 'some', 'attributes'],
      type: Table.ProjectionType.Include,
    },
  });

  const testTable = new Table<TestTableKey, TestTableAttributes>({
    name: 'TestTable',
    keyAttributes: {
      P: { type: Table.PrimaryAttributeType.String },
      S: { type: Table.PrimaryAttributeType.String },
      G0P: { type: Table.PrimaryAttributeType.String },
      G0S: { type: Table.PrimaryAttributeType.String },
      L0S: { type: Table.PrimaryAttributeType.Number },
    },
    keySchema: {
      P: { keyType: Table.PrimaryKeyType.Hash },
      S: { keyType: Table.PrimaryKeyType.Range },
    },
    globalIndexes: [gsi0 as IndexBase],
    localIndexes: [lsi0 as IndexBase],
    client,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Table with Index', () => {
    validateTable(testTable);
  });

  it('getParams', () => {
    const params = testTable.getParams({ P: 'pk', S: 'sk' });
    expect(params).toEqual({
      Key: { P: 'pk', S: 'sk' },
      TableName: 'TestTable',
    });
  });

  it('deleteParams', () => {
    const params = testTable.deleteParams({ P: 'pk', S: 'sk' });
    expect(params).toEqual({
      Key: { P: 'pk', S: 'sk' },
      TableName: 'TestTable',
    });
  });

  it('putParams', () => {
    const params = testTable.putParams({ P: 'pk', S: 'sk' });
    expect(params).toEqual({
      Item: { P: 'pk', S: 'sk' },
      TableName: 'TestTable',
    });
  });

  it('putParams for exists', () => {
    const params = testTable.putParams({ P: 'pk', S: 'sk' }, undefined, {
      writeOptions: Table.PutWriteOptions.Exists,
    });
    expect(params).toEqual({
      ConditionExpression: 'attribute_exists(#n0)',
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: {},
      Item: { P: 'pk', S: 'sk' },
      TableName: 'TestTable',
    });
  });

  it('putParams for not exists', () => {
    const params = testTable.putParams({ P: 'pk', S: 'sk' }, undefined, {
      writeOptions: Table.PutWriteOptions.NotExists,
    });
    expect(params).toEqual({
      ConditionExpression: 'attribute_not_exists(#n0)',
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: {},
      Item: { P: 'pk', S: 'sk' },
      TableName: 'TestTable',
    });
  });

  it('updateParams', () => {
    const params = testTable.updateParams({ P: 'pk', S: 'sk' });
    expect(params).toEqual({
      Key: { P: 'pk', S: 'sk' },
      TableName: 'TestTable',
    });
  });

  it('get', async () => {
    client.get = jest.fn((params) => request);
    const results = await testTable.get({ P: 'pk', S: 'sk' });
    expect(results).toEqual({ Attributes: {} });
    expect(client.get).toBeCalledWith({
      Key: { P: 'pk', S: 'sk' },
      TableName: 'TestTable',
    });
    expect(client.get).toBeCalledTimes(1);
  });

  it('delete', async () => {
    client.delete = jest.fn((params) => request);
    const results = await testTable.delete({ P: 'pk', S: 'sk' });
    expect(results).toEqual({ Attributes: {} });
    expect(client.delete).toBeCalledWith({
      Key: { P: 'pk', S: 'sk' },
      TableName: 'TestTable',
    });
    expect(client.delete).toBeCalledTimes(1);
  });

  it('put just key', async () => {
    client.put = jest.fn((params) => request);
    const results = await testTable.put({ P: 'pk', S: 'sk' });
    expect(results).toEqual({ Attributes: {} });
    expect(client.put).toBeCalledWith({
      Item: { P: 'pk', S: 'sk' },
      TableName: 'TestTable',
    });
    expect(client.put).toBeCalledTimes(1);
  });

  it('put exists just key', async () => {
    client.put = jest.fn((params) => request);
    const results = await testTable.put({ P: 'pk', S: 'sk' }, undefined, {
      writeOptions: Table.PutWriteOptions.Exists,
    });
    expect(results).toEqual({ Attributes: {} });
    expect(client.put).toBeCalledWith({
      ConditionExpression: 'attribute_exists(#n0)',
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: {},
      Item: { P: 'pk', S: 'sk' },
      TableName: 'TestTable',
    });
    expect(client.put).toBeCalledTimes(1);
  });

  it('put not exists just key', async () => {
    client.put = jest.fn((params) => request);
    const results = await testTable.put({ P: 'pk', S: 'sk' }, undefined, {
      writeOptions: Table.PutWriteOptions.NotExists,
    });
    expect(results).toEqual({ Attributes: {} });
    expect(client.put).toBeCalledWith({
      ConditionExpression: 'attribute_not_exists(#n0)',
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: {},
      Item: { P: 'pk', S: 'sk' },
      TableName: 'TestTable',
    });
    expect(client.put).toBeCalledTimes(1);
  });

  it('put with item', async () => {
    client.put = jest.fn((params) => request);
    const results = await testTable.put({ P: 'pk', S: 'sk' }, { string: 'string', number: 8, bool: true });
    expect(results).toEqual({ Attributes: {} });
    expect(client.put).toBeCalledWith({
      Item: { P: 'pk', S: 'sk', bool: true, number: 8, string: 'string' },
      TableName: 'TestTable',
    });
    expect(client.put).toBeCalledTimes(1);
  });

  it('update just key', async () => {
    client.update = jest.fn((params) => request);
    const results = await testTable.update({ P: 'pk', S: 'sk' });
    expect(results).toEqual({ Attributes: {} });
    expect(client.update).toBeCalledWith({
      Key: { P: 'pk', S: 'sk' },
      TableName: 'TestTable',
    });
    expect(client.update).toBeCalledTimes(1);
  });

  it('update with item', async () => {
    client.update = jest.fn((params) => request);
    const results = await testTable.update({ P: 'pk', S: 'sk' }, { string: 'string', number: 18, bool: true });
    expect(results).toEqual({ Attributes: {} });
    expect(client.update).toBeCalledWith({
      ExpressionAttributeNames: {
        '#n0': 'string',
        '#n1': 'number',
        '#n2': 'bool',
      },
      ExpressionAttributeValues: {
        ':v0': 'string',
        ':v1': 18,
        ':v2': true,
      },
      Key: { P: 'pk', S: 'sk' },
      TableName: 'TestTable',
      UpdateExpression: 'SET #n0 = :v0, #n1 = :v1, #n2 = :v2',
    });
    expect(client.update).toBeCalledTimes(1);
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
    client.query = jest.fn((params) => request);
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
    client.scan = jest.fn((params) => request);
    const results = await gsi0.scan();
    expect(results).toEqual({ Attributes: {} });
    expect(client.scan).toBeCalledWith({
      IndexName: 'GSI0',
      TableName: 'TestTable',
    });
    expect(client.scan).toBeCalledTimes(1);
  });
});
