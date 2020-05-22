import { ExpressionAttributes } from '../src/ExpressionAttributes';
import { KeyCondition, KeyConditionExpression } from '../src/KeyCondition';
import { Table } from '../src/Table';

it('Validate Condition exports', () => {
  expect(typeof KeyCondition).toEqual('function');
  expect(typeof KeyConditionExpression).toEqual('function');
});

function buildParams(
  key: Table.PrimaryKey.KeyQueryMap,
): { KeyConditionExpression?: string } & Table.ExpressionAttributeParams {
  const params = {};
  const attributes = new ExpressionAttributes();
  KeyConditionExpression.addParams(params, attributes, key);
  ExpressionAttributes.addParams(params, attributes);
  return params;
}

describe('Validate KeyCondition', () => {
  it('addParam with empty key', () => {
    expect(buildParams({})).toEqual({});
  });
  it('addParam', () => {
    expect(buildParams({ P: KeyCondition.eq('keyValue') })).toEqual({
      KeyConditionExpression: '#n0 = :v0',
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 'keyValue' },
    });
  });

  it('eq', () => {
    expect(buildParams({ P: KeyCondition.eq('keyValue') })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 'keyValue' },
      KeyConditionExpression: '#n0 = :v0',
    });
  });

  it('lt', () => {
    const ltValue = 4;
    expect(buildParams({ P: KeyCondition.lt(ltValue) })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': ltValue },
      KeyConditionExpression: '#n0 < :v0',
    });
  });

  it('le', () => {
    expect(buildParams({ P: KeyCondition.le(6) })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 6 },
      KeyConditionExpression: '#n0 <= :v0',
    });
  });

  it('gt', () => {
    expect(buildParams({ P: KeyCondition.gt(8) })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 8 },
      KeyConditionExpression: '#n0 > :v0',
    });
  });

  it('ge', () => {
    expect(buildParams({ P: KeyCondition.ge(10) })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 10 },
      KeyConditionExpression: '#n0 >= :v0',
    });
  });

  it('between', () => {
    expect(buildParams({ P: KeyCondition.between('a', 'z') })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 'a', ':v1': 'z' },
      KeyConditionExpression: '#n0 BETWEEN :v0 AND :v1',
    });
  });

  it('beginsWith', () => {
    expect(buildParams({ P: KeyCondition.beginsWith('abc') })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 'abc' },
      KeyConditionExpression: 'begins_with(#n0, :v0)',
    });
  });

  it('buildInput with KeyConditionExpression', () => {
    expect(buildParams({ P: KeyCondition.eq('with exp') })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 'with exp' },
      KeyConditionExpression: '#n0 = :v0',
    });
  });

  it('buildInput with 2 keys', () => {
    expect(buildParams({ P: 'abc', S: KeyCondition.beginsWith('with exp') })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P', '#n1': 'S' },
      ExpressionAttributeValues: { ':v0': 'abc', ':v1': 'with exp' },
      KeyConditionExpression: '#n0 = :v0 AND begins_with(#n1, :v1)',
    });
  });

  it('buildInput with 3 keys', () => {
    expect(buildParams({ P: 'abc', S: KeyCondition.beginsWith('with exp'), E: 'extraKey' })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P', '#n1': 'S', '#n2': 'E' },
      ExpressionAttributeValues: { ':v0': 'abc', ':v1': 'with exp', ':v2': 'extraKey' },
      KeyConditionExpression: '#n0 = :v0 AND begins_with(#n1, :v1)',
    });
  });
});
