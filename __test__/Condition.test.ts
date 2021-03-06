import { ExpressionAttributeNameMap } from 'aws-sdk/clients/dynamodb';
import { Condition, ConditionExpression } from '../src/Condition';
import { ExpressionAttributes } from '../src/ExpressionAttributes';
import { Table } from '../src/Table';

// Note: Using classes to scope static methods, allow use of reserved words (like 'in') as methods and
// let TypeDoc produce more consistent documentation (thought it does mean that Condition which acts
// more as a namespace or module has all static methods).

function buildParams(
  conditions: Condition.Resolver[] | undefined,
  type: 'filter' | 'condition' = 'condition',
): {
  ConditionExpression?: string;
  ExpressionAttributeNames?: ExpressionAttributeNameMap;
  ExpressionAttributeValues?: Table.AttributeValuesMap;
} {
  const params = {};
  const attributes = new ExpressionAttributes();
  ConditionExpression.addParams(params, attributes, type, conditions);
  ExpressionAttributes.addParams(params, attributes);
  return params;
}

it('Validate Condition exports', () => {
  expect(typeof Condition.eq).toEqual('function');
  expect(typeof Condition.ne).toEqual('function');
});

describe('Validate Condition with values', () => {
  it('eq', () => {
    const condition = Condition.eq('path1', 'value1');
    expect(buildParams([condition])).toEqual({
      ConditionExpression: '#n0 = :v0',
      ExpressionAttributeNames: { '#n0': 'path1' },
      ExpressionAttributeValues: { ':v0': 'value1' },
    });
  });

  it('ne', () => {
    const condition = Condition.ne('path1', 'value1');
    expect(buildParams([condition])).toEqual({
      ConditionExpression: '#n0 <> :v0',
      ExpressionAttributeNames: { '#n0': 'path1' },
      ExpressionAttributeValues: { ':v0': 'value1' },
    });
  });

  it('lt', () => {
    const condition = Condition.lt('path1', 'value1');
    expect(buildParams([condition])).toEqual({
      ConditionExpression: '#n0 < :v0',
      ExpressionAttributeNames: { '#n0': 'path1' },
      ExpressionAttributeValues: { ':v0': 'value1' },
    });
  });
  it('le', () => {
    const condition = Condition.le('path1', 'value1');
    expect(buildParams([condition])).toEqual({
      ConditionExpression: '#n0 <= :v0',
      ExpressionAttributeNames: { '#n0': 'path1' },
      ExpressionAttributeValues: { ':v0': 'value1' },
    });
  });

  it('gt', () => {
    const condition = Condition.gt('path1', 'value1');
    expect(buildParams([condition])).toEqual({
      ConditionExpression: '#n0 > :v0',
      ExpressionAttributeNames: { '#n0': 'path1' },
      ExpressionAttributeValues: { ':v0': 'value1' },
    });
  });

  it('ge', () => {
    const condition = Condition.ge('path1', 'value1');
    expect(buildParams([condition])).toEqual({
      ConditionExpression: '#n0 >= :v0',
      ExpressionAttributeNames: { '#n0': 'path1' },
      ExpressionAttributeValues: { ':v0': 'value1' },
    });
  });

  it('between', () => {
    const condition = Condition.between('path1', 'value1', 'value2');
    expect(buildParams([condition])).toEqual({
      ConditionExpression: '#n0 BETWEEN :v0 AND :v1',
      ExpressionAttributeNames: { '#n0': 'path1' },
      ExpressionAttributeValues: { ':v0': 'value1', ':v1': 'value2' },
    });
  });

  it('in', () => {
    const condition = Condition.in('path1', ['value1', 'value2', 'value3']);
    expect(buildParams([condition])).toEqual({
      ConditionExpression: '#n0 IN (:v0, :v1, :v2)',
      ExpressionAttributeNames: { '#n0': 'path1' },
      ExpressionAttributeValues: { ':v0': 'value1', ':v1': 'value2', ':v2': 'value3' },
    });
  });

  it('contains', () => {
    const condition = Condition.contains('path1', 'value1');
    expect(buildParams([condition])).toEqual({
      ConditionExpression: 'contains(#n0, :v0)',
      ExpressionAttributeNames: { '#n0': 'path1' },
      ExpressionAttributeValues: { ':v0': 'value1' },
    });
  });

  it('beginsWith', () => {
    const condition = Condition.beginsWith('path1', 'value1');
    expect(buildParams([condition])).toEqual({
      ConditionExpression: 'begins_with(#n0, :v0)',
      ExpressionAttributeNames: { '#n0': 'path1' },
      ExpressionAttributeValues: { ':v0': 'value1' },
    });
  });

  it('type', () => {
    const condition = Condition.type('path1', 'S');
    expect(buildParams([condition])).toEqual({
      ConditionExpression: 'attribute_type(#n0, :v0)',
      ExpressionAttributeNames: { '#n0': 'path1' },
      ExpressionAttributeValues: { ':v0': 'S' },
    });
  });

  it('exists', () => {
    const condition = Condition.exists('path1');
    expect(buildParams([condition])).toEqual({
      ConditionExpression: 'attribute_exists(#n0)',
      ExpressionAttributeNames: { '#n0': 'path1' },
    });
  });

  it('notExists', () => {
    const condition = Condition.notExists('path1');
    expect(buildParams([condition])).toEqual({
      ConditionExpression: 'attribute_not_exists(#n0)',
      ExpressionAttributeNames: { '#n0': 'path1' },
    });
  });

  it('size', () => {
    const condition = Condition.gt(Condition.size('path1'), 8);
    expect(buildParams([condition])).toEqual({
      ConditionExpression: 'size(#n0) > :v0',
      ExpressionAttributeNames: { '#n0': 'path1' },
      ExpressionAttributeValues: { ':v0': 8 },
    });
  });
});

describe('Validate Condition with Paths', () => {
  it('eq with Path', () => {
    const condition = Condition.eq('path1', Condition.path('value1'));
    expect(buildParams([condition])).toEqual({
      ConditionExpression: '#n0 = #n1',
      ExpressionAttributeNames: { '#n0': 'path1', '#n1': 'value1' },
    });
  });

  it('ne with Path', () => {
    const condition = Condition.ne('path1', Condition.path('value1'));
    expect(buildParams([condition])).toEqual({
      ConditionExpression: '#n0 <> #n1',
      ExpressionAttributeNames: { '#n0': 'path1', '#n1': 'value1' },
    });
  });

  it('lt with Path', () => {
    const condition = Condition.lt('path1', Condition.path('value1'));
    expect(buildParams([condition])).toEqual({
      ConditionExpression: '#n0 < #n1',
      ExpressionAttributeNames: { '#n0': 'path1', '#n1': 'value1' },
    });
  });
  it('le with Path', () => {
    const condition = Condition.le('path1', Condition.path('value1'));
    expect(buildParams([condition])).toEqual({
      ConditionExpression: '#n0 <= #n1',
      ExpressionAttributeNames: { '#n0': 'path1', '#n1': 'value1' },
    });
  });

  it('gt with Path', () => {
    const condition = Condition.gt('path1', Condition.path('value1'));
    expect(buildParams([condition])).toEqual({
      ConditionExpression: '#n0 > #n1',
      ExpressionAttributeNames: { '#n0': 'path1', '#n1': 'value1' },
    });
  });

  it('ge with Path', () => {
    const condition = Condition.ge('path1', Condition.path('value1'));
    expect(buildParams([condition])).toEqual({
      ConditionExpression: '#n0 >= #n1',
      ExpressionAttributeNames: { '#n0': 'path1', '#n1': 'value1' },
    });
  });

  it('between with Path', () => {
    const condition = Condition.between('path1', Condition.path('value1'), Condition.path('value2'));
    expect(buildParams([condition])).toEqual({
      ConditionExpression: '#n0 BETWEEN #n1 AND #n2',
      ExpressionAttributeNames: { '#n0': 'path1', '#n1': 'value1', '#n2': 'value2' },
    });
  });

  it('in with Path', () => {
    const condition = Condition.in('path1', [
      Condition.path('value1'),
      Condition.path('value2'),
      Condition.path('value3'),
    ]);
    expect(buildParams([condition])).toEqual({
      ConditionExpression: '#n0 IN (#n1, #n2, #n3)',
      ExpressionAttributeNames: { '#n0': 'path1', '#n1': 'value1', '#n2': 'value2', '#n3': 'value3' },
    });
  });
});

describe('Validate Condition', () => {
  const condition1 = Condition.le('path1', 'value1');
  const condition2 = Condition.ge('path2', 'value2');
  const condition3 = Condition.eq('path3', 3);
  const condition4 = Condition.ne('path4', 4);

  it('add Conditions', () => {
    const logical = Condition.and(condition1, condition2);
    expect(buildParams([logical])).toEqual({
      ConditionExpression: '(#n0 <= :v0 AND #n1 >= :v1)',
      ExpressionAttributeNames: { '#n0': 'path1', '#n1': 'path2' },
      ExpressionAttributeValues: { ':v0': 'value1', ':v1': 'value2' },
    });
  });

  it('or Conditions', () => {
    const logical = Condition.or(condition1, condition2);
    expect(buildParams([logical])).toEqual({
      ConditionExpression: '(#n0 <= :v0 OR #n1 >= :v1)',
      ExpressionAttributeNames: { '#n0': 'path1', '#n1': 'path2' },
      ExpressionAttributeValues: { ':v0': 'value1', ':v1': 'value2' },
    });
  });

  it('not Conditions', () => {
    const logical = Condition.not(condition1);
    expect(buildParams([logical])).toEqual({
      ConditionExpression: '(NOT #n0 <= :v0)',
      ExpressionAttributeNames: { '#n0': 'path1' },
      ExpressionAttributeValues: { ':v0': 'value1' },
    });
  });

  it('and Conditions with 1', () => {
    const logical = Condition.and(condition1);
    expect(buildParams([logical])).toEqual({
      ConditionExpression: '(#n0 <= :v0)',
      ExpressionAttributeNames: { '#n0': 'path1' },
      ExpressionAttributeValues: { ':v0': 'value1' },
    });
  });

  it('or Conditions with 1', () => {
    const logical = Condition.or(condition1);
    expect(buildParams([logical])).toEqual({
      ConditionExpression: '(#n0 <= :v0)',
      ExpressionAttributeNames: { '#n0': 'path1' },
      ExpressionAttributeValues: { ':v0': 'value1' },
    });
  });

  it('and with 4 conditions', () => {
    const logical = Condition.and(condition1, condition2, condition3, condition4);
    expect(buildParams([logical])).toEqual({
      ConditionExpression: '(#n0 <= :v0 AND #n1 >= :v1 AND #n2 = :v2 AND #n3 <> :v3)',
      ExpressionAttributeNames: { '#n0': 'path1', '#n1': 'path2', '#n2': 'path3', '#n3': 'path4' },
      ExpressionAttributeValues: { ':v0': 'value1', ':v1': 'value2', ':v2': 3, ':v3': 4 },
    });
  });

  it('and with Conditions', () => {
    const logical1 = Condition.not(condition1);
    const logical2 = Condition.and(condition2, condition3);
    const logical3 = Condition.and(logical1, logical2);
    expect(buildParams([logical3])).toEqual({
      ConditionExpression: '((NOT #n0 <= :v0) AND (#n1 >= :v1 AND #n2 = :v2))',
      ExpressionAttributeNames: { '#n0': 'path1', '#n1': 'path2', '#n2': 'path3' },
      ExpressionAttributeValues: { ':v0': 'value1', ':v1': 'value2', ':v2': 3 },
    });
  });

  it('add with Conditions and Conditions', () => {
    const logical1 = Condition.not(condition1);
    const logical3 = Condition.and(logical1, condition2, condition3);
    expect(buildParams([logical3])).toEqual({
      ConditionExpression: '((NOT #n0 <= :v0) AND #n1 >= :v1 AND #n2 = :v2)',
      ExpressionAttributeNames: { '#n0': 'path1', '#n1': 'path2', '#n2': 'path3' },
      ExpressionAttributeValues: { ':v0': 'value1', ':v1': 'value2', ':v2': 3 },
    });
  });

  it('or with 4 conditions', () => {
    const logical = Condition.or(condition1, condition2, condition3, condition4);
    expect(buildParams([logical])).toEqual({
      ConditionExpression: '(#n0 <= :v0 OR #n1 >= :v1 OR #n2 = :v2 OR #n3 <> :v3)',
      ExpressionAttributeNames: { '#n0': 'path1', '#n1': 'path2', '#n2': 'path3', '#n3': 'path4' },
      ExpressionAttributeValues: { ':v0': 'value1', ':v1': 'value2', ':v2': 3, ':v3': 4 },
    });
  });

  it('or with Conditions', () => {
    const logical1 = Condition.not(condition1);
    const logical2 = Condition.or(condition2, condition3);
    const logical3 = Condition.or(logical1, logical2);
    expect(buildParams([logical3])).toEqual({
      ConditionExpression: '((NOT #n0 <= :v0) OR (#n1 >= :v1 OR #n2 = :v2))',
      ExpressionAttributeNames: { '#n0': 'path1', '#n1': 'path2', '#n2': 'path3' },
      ExpressionAttributeValues: { ':v0': 'value1', ':v1': 'value2', ':v2': 3 },
    });
  });

  it('or with Conditions and Conditions', () => {
    const logical1 = Condition.not(condition1);
    const logical3 = Condition.or(logical1, condition2, condition3);
    expect(buildParams([logical3])).toEqual({
      ConditionExpression: '((NOT #n0 <= :v0) OR #n1 >= :v1 OR #n2 = :v2)',
      ExpressionAttributeNames: { '#n0': 'path1', '#n1': 'path2', '#n2': 'path3' },
      ExpressionAttributeValues: { ':v0': 'value1', ':v1': 'value2', ':v2': 3 },
    });
  });

  it('buildParams with undefined conditions', () => {
    expect(buildParams(undefined)).toEqual({});
  });

  it('buildParams with empty conditions', () => {
    expect(buildParams([])).toEqual({});
  });
  it('buildParams with single conditions', () => {
    const condition = Condition.eq('path1', 'value1');
    expect(buildParams([condition])).toEqual({
      ConditionExpression: '#n0 = :v0',
      ExpressionAttributeNames: { '#n0': 'path1' },
      ExpressionAttributeValues: { ':v0': 'value1' },
    });
  });

  it('buildParams with two conditions', () => {
    const conditions = [Condition.eq('path1', 'value1'), Condition.gt('path2', 'value2')];
    expect(buildParams(conditions)).toEqual({
      ConditionExpression: '#n0 = :v0 AND #n1 > :v1',
      ExpressionAttributeNames: { '#n0': 'path1', '#n1': 'path2' },
      ExpressionAttributeValues: { ':v0': 'value1', ':v1': 'value2' },
    });
  });

  it('buildParams filter with undefined conditions', () => {
    expect(buildParams(undefined, 'filter')).toEqual({});
  });

  it('buildParams filter with empty conditions', () => {
    expect(buildParams([], 'filter')).toEqual({});
  });
  it('buildParams filter with single conditions', () => {
    const condition = Condition.eq('path1', 'value1');
    expect(buildParams([condition], 'filter')).toEqual({
      FilterExpression: '#n0 = :v0',
      ExpressionAttributeNames: { '#n0': 'path1' },
      ExpressionAttributeValues: { ':v0': 'value1' },
    });
  });

  it('buildParams filter with two conditions', () => {
    const conditions = [Condition.eq('path1', 'value1'), Condition.gt('path2', 'value2')];
    expect(buildParams(conditions, 'filter')).toEqual({
      FilterExpression: '#n0 = :v0 AND #n1 > :v1',
      ExpressionAttributeNames: { '#n0': 'path1', '#n1': 'path2' },
      ExpressionAttributeValues: { ':v0': 'value1', ':v1': 'value2' },
    });
  });
});
