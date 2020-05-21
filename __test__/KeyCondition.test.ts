import { ExpressionAttributeNameMap } from 'aws-sdk/clients/dynamodb';
import { ExpressionAttributes } from '../src/ExpressionAttributes';
import { KeyCondition, KeyConditionExpression } from '../src/KeyCondition';
import { Table } from '../src/Table';

it('Validate Condition exports', () => {
  expect(typeof KeyCondition).toEqual('function');
  expect(typeof KeyConditionExpression).toEqual('function');
});

function buildKeyCondition(
  key: Table.PrimaryKey.KeyQueryMap,
  exp = new KeyConditionExpression(),
): {
  KeyConditionExpression?: string;
  ExpressionAttributeNames?: ExpressionAttributeNameMap;
  ExpressionAttributeValues?: Table.AttributeValuesMap;
} | void {
  const params = {};
  KeyConditionExpression.addParam(key, exp, params);
  ExpressionAttributes.addParams(exp.attributes, params);
  return params;
}

describe('Validate KeyCondition', () => {
  it('addParam with undefined key', () => {
    const exp = new KeyConditionExpression();
    expect(KeyConditionExpression.addParam(undefined, exp, {})).toEqual({});
  });
  it('addParam with empty key', () => {
    const exp = new KeyConditionExpression();
    expect(KeyConditionExpression.addParam({}, exp, {})).toEqual({});
  });
  it('addParam', () => {
    const exp = new KeyConditionExpression();
    expect(KeyConditionExpression.addParam({ P: KeyCondition.eq('keyValue') }, exp, {})).toEqual({
      KeyConditionExpression: '#n0 = :v0',
    });
  });

  it('eq', () => {
    expect(buildKeyCondition({ P: KeyCondition.eq('keyValue') })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 'keyValue' },
      KeyConditionExpression: '#n0 = :v0',
    });
  });

  it('lt', () => {
    const ltValue = 4;
    expect(buildKeyCondition({ P: KeyCondition.lt(ltValue) })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': ltValue },
      KeyConditionExpression: '#n0 < :v0',
    });
  });

  it('le', () => {
    expect(buildKeyCondition({ P: KeyCondition.le(6) })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 6 },
      KeyConditionExpression: '#n0 <= :v0',
    });
  });

  it('gt', () => {
    expect(buildKeyCondition({ P: KeyCondition.gt(8) })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 8 },
      KeyConditionExpression: '#n0 > :v0',
    });
  });

  it('ge', () => {
    expect(buildKeyCondition({ P: KeyCondition.ge(10) })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 10 },
      KeyConditionExpression: '#n0 >= :v0',
    });
  });

  it('between', () => {
    expect(buildKeyCondition({ P: KeyCondition.between('a', 'z') })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 'a', ':v1': 'z' },
      KeyConditionExpression: '#n0 BETWEEN :v0 AND :v1',
    });
  });

  it('beginsWith', () => {
    expect(buildKeyCondition({ P: KeyCondition.beginsWith('abc') })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 'abc' },
      KeyConditionExpression: 'begins_with(#n0, :v0)',
    });
  });

  it('buildInput with KeyConditionExpression', () => {
    const exp = new KeyConditionExpression();
    expect(buildKeyCondition({ P: KeyCondition.eq('with exp') }, exp)).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 'with exp' },
      KeyConditionExpression: '#n0 = :v0',
    });
  });

  it('buildInput with 2 keys', () => {
    expect(buildKeyCondition({ P: 'abc', S: KeyCondition.beginsWith('with exp') })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P', '#n1': 'S' },
      ExpressionAttributeValues: { ':v0': 'abc', ':v1': 'with exp' },
      KeyConditionExpression: '#n0 = :v0 AND begins_with(#n1, :v1)',
    });
  });

  it('buildInput with 3 keys', () => {
    expect(buildKeyCondition({ P: 'abc', S: KeyCondition.beginsWith('with exp'), E: 'extraKey' })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P', '#n1': 'S', '#n2': 'E' },
      ExpressionAttributeValues: { ':v0': 'abc', ':v1': 'with exp', ':v2': 'extraKey' },
      KeyConditionExpression: '#n0 = :v0 AND begins_with(#n1, :v1)',
    });
  });
});
