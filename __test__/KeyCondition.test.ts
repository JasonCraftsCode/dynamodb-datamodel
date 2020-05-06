import { ExpressionAttributeNameMap } from 'aws-sdk/clients/dynamodb';
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
  KeyConditionExpression: string;
  Paths: ExpressionAttributeNameMap;
  Values: Table.AttributeValuesMap;
} {
  const keyCondition = KeyCondition.buildExpression(key, exp);
  return {
    KeyConditionExpression: keyCondition,
    Paths: exp.attributes.getPaths(),
    Values: exp.attributes.getValues(),
  };
}

describe('Validate KeyCondition', () => {
  it('addParam with undefined key', () => {
    const exp = new KeyConditionExpression();
    expect(KeyCondition.addParam(undefined, exp, {})).toEqual({});
  });
  it('addParam with empty key', () => {
    const exp = new KeyConditionExpression();
    expect(KeyCondition.addParam({}, exp, {})).toEqual({});
  });
  it('addParam', () => {
    const exp = new KeyConditionExpression();
    expect(KeyCondition.addParam({ P: KeyCondition.eq('keyValue') }, exp, {})).toEqual({
      KeyConditionExpression: '#n0 = :v0',
    });
  });

  it('eq', () => {
    expect(buildKeyCondition({ P: KeyCondition.eq('keyValue') })).toEqual({
      Paths: { '#n0': 'P' },
      Values: { ':v0': 'keyValue' },
      KeyConditionExpression: '#n0 = :v0',
    });
  });

  it('lt', () => {
    expect(buildKeyCondition({ P: KeyCondition.lt(4) })).toEqual({
      Paths: { '#n0': 'P' },
      Values: { ':v0': 4 },
      KeyConditionExpression: '#n0 < :v0',
    });
  });

  it('le', () => {
    expect(buildKeyCondition({ P: KeyCondition.le(6) })).toEqual({
      Paths: { '#n0': 'P' },
      Values: { ':v0': 6 },
      KeyConditionExpression: '#n0 <= :v0',
    });
  });

  it('gt', () => {
    expect(buildKeyCondition({ P: KeyCondition.gt(8) })).toEqual({
      Paths: { '#n0': 'P' },
      Values: { ':v0': 8 },
      KeyConditionExpression: '#n0 > :v0',
    });
  });

  it('ge', () => {
    expect(buildKeyCondition({ P: KeyCondition.ge(10) })).toEqual({
      Paths: { '#n0': 'P' },
      Values: { ':v0': 10 },
      KeyConditionExpression: '#n0 >= :v0',
    });
  });

  it('between', () => {
    expect(buildKeyCondition({ P: KeyCondition.between('a', 'z') })).toEqual({
      Paths: { '#n0': 'P' },
      Values: { ':v0': 'a', ':v1': 'z' },
      KeyConditionExpression: '#n0 BETWEEN :v0 AND :v1',
    });
  });

  it('beginsWith', () => {
    expect(buildKeyCondition({ P: KeyCondition.beginsWith('abc') })).toEqual({
      Paths: { '#n0': 'P' },
      Values: { ':v0': 'abc' },
      KeyConditionExpression: 'begins_with(#n0, :v0)',
    });
  });

  it('buildInput with KeyConditionExpression', () => {
    const exp = new KeyConditionExpression();
    expect(buildKeyCondition({ P: KeyCondition.eq('with exp') }, exp)).toEqual({
      Paths: { '#n0': 'P' },
      Values: { ':v0': 'with exp' },
      KeyConditionExpression: '#n0 = :v0',
    });
  });

  it('buildInput with 2 keys', () => {
    expect(buildKeyCondition({ P: 'abc', S: KeyCondition.beginsWith('with exp') })).toEqual({
      Paths: { '#n0': 'P', '#n1': 'S' },
      Values: { ':v0': 'abc', ':v1': 'with exp' },
      KeyConditionExpression: '#n0 = :v0 AND begins_with(#n1, :v1)',
    });
  });

  it('buildInput with 3 keys', () => {
    expect(buildKeyCondition({ P: 'abc', S: KeyCondition.beginsWith('with exp'), E: 'extraKey' })).toEqual({
      Paths: { '#n0': 'P', '#n1': 'S', '#n2': 'E' },
      Values: { ':v0': 'abc', ':v1': 'with exp', ':v2': 'extraKey' },
      KeyConditionExpression: '#n0 = :v0 AND begins_with(#n1, :v1)',
    });
  });
});
