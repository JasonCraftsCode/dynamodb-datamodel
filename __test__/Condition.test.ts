import { ConditionOperator, AttributeType } from '../src/Common';
import { Condition, LogicalCondition, buildCondition, buildConditionInput } from '../src/Condition';
import { ExpressionAttributes } from '../src/ExpressionAttributes';

it('Validate Condition exports', () => {
  expect(typeof LogicalCondition).toEqual('function');
  expect(typeof Condition).toEqual('function');
  expect(typeof buildCondition).toEqual('function');
});

it('Validate Condition aliased names are the same', () => {
  expect(Condition.eq).toEqual(Condition.equal);
  expect(Condition.ne).toEqual(Condition.notEqual);
  expect(Condition.lt).toEqual(Condition.lessThen);
  expect(Condition.le).toEqual(Condition.lessThenEqual);
  expect(Condition.gt).toEqual(Condition.greaterThen);
  expect(Condition.ge).toEqual(Condition.greaterThenEqual);
});

describe('Validate Condition with values', () => {
  const attribs = new ExpressionAttributes();
  beforeEach(() => {
    attribs.reset();
  });

  it('eq', () => {
    const cond = Condition.eq('path1', 'value1');
    expect(cond.op).toEqual(ConditionOperator.Equal);
    expect(cond.buildExpression(attribs)).toEqual('#n0 = :v0');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1' });
    expect(attribs.getValues()).toEqual({ ':v0': 'value1' });
  });

  it('ne', () => {
    const cond = Condition.ne('path1', 'value1');
    expect(cond.op).toEqual(ConditionOperator.NotEqual);
    expect(cond.buildExpression(attribs)).toEqual('#n0 <> :v0');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1' });
    expect(attribs.getValues()).toEqual({ ':v0': 'value1' });
  });

  it('lt', () => {
    const cond = Condition.lt('path1', 'value1');
    expect(cond.op).toEqual(ConditionOperator.LessThen);
    expect(cond.buildExpression(attribs)).toEqual('#n0 < :v0');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1' });
    expect(attribs.getValues()).toEqual({ ':v0': 'value1' });
  });
  it('le', () => {
    const cond = Condition.le('path1', 'value1');
    expect(cond.op).toEqual(ConditionOperator.LessThenEqual);
    expect(cond.buildExpression(attribs)).toEqual('#n0 <= :v0');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1' });
    expect(attribs.getValues()).toEqual({ ':v0': 'value1' });
  });

  it('gt', () => {
    const cond = Condition.gt('path1', 'value1');
    expect(cond.op).toEqual(ConditionOperator.GreaterThen);
    expect(cond.buildExpression(attribs)).toEqual('#n0 > :v0');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1' });
    expect(attribs.getValues()).toEqual({ ':v0': 'value1' });
  });

  it('ge', () => {
    const cond = Condition.ge('path1', 'value1');
    expect(cond.op).toEqual(ConditionOperator.GreaterThenEqual);
    expect(cond.buildExpression(attribs)).toEqual('#n0 >= :v0');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1' });
    expect(attribs.getValues()).toEqual({ ':v0': 'value1' });
  });

  it('between', () => {
    const cond = Condition.between('path1', 'value1', 'value2');
    expect(cond.op).toEqual(ConditionOperator.Between);
    expect(cond.buildExpression(attribs)).toEqual('#n0 BETWEEN :v0 AND :v1');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1' });
    expect(attribs.getValues()).toEqual({ ':v0': 'value1', ':v1': 'value2' });
  });

  it('in', () => {
    const cond = Condition.in('path1', ['value1', 'value2', 'value3']);
    expect(cond.op).toEqual(ConditionOperator.In);
    expect(cond.buildExpression(attribs)).toEqual('#n0 IN (:v0, :v1, :v2)');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1' });
    expect(attribs.getValues()).toEqual({
      ':v0': 'value1',
      ':v1': 'value2',
      ':v2': 'value3',
    });
  });

  it('contains', () => {
    const cond = Condition.contains('path1', 'value1');
    expect(cond.op).toEqual(ConditionOperator.Contains);
    expect(cond.buildExpression(attribs)).toEqual('contains(#n0, :v0)');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1' });
    expect(attribs.getValues()).toEqual({ ':v0': 'value1' });
  });

  it('beginsWith', () => {
    const cond = Condition.beginsWith('path1', 'value1');
    expect(cond.op).toEqual(ConditionOperator.BeginsWith);
    expect(cond.buildExpression(attribs)).toEqual('begins_with(#n0, :v0)');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1' });
    expect(attribs.getValues()).toEqual({ ':v0': 'value1' });
  });

  it('type', () => {
    const cond = Condition.type('path1', AttributeType.String);
    expect(cond.op).toEqual(ConditionOperator.Type);
    expect(cond.buildExpression(attribs)).toEqual('attribute_type(#n0, :v0)');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1' });
    expect(attribs.getValues()).toEqual({ ':v0': 'S' });
  });

  it('exists', () => {
    const cond = Condition.exists('path1');
    expect(cond.op).toEqual(ConditionOperator.Exists);
    expect(cond.buildExpression(attribs)).toEqual('attribute_exists(#n0)');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1' });
    expect(attribs.getValues()).toEqual({});
  });

  it('notExists', () => {
    const cond = Condition.notExists('path1');
    expect(cond.op).toEqual(ConditionOperator.NotExists);
    expect(cond.buildExpression(attribs)).toEqual('attribute_not_exists(#n0)');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1' });
    expect(attribs.getValues()).toEqual({});
  });

  it('size', () => {
    const cond = Condition.gt(Condition.size('path1'), 8);
    expect(cond.buildExpression(attribs)).toEqual('size(#n0) > :v0');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1' });
    expect(attribs.getValues()).toEqual({ ':v0': 8 });
  });
});

describe('Validate Condition with Paths', () => {
  const attribs = new ExpressionAttributes();
  beforeEach(() => {
    attribs.reset();
  });

  it('eq with Path', () => {
    const cond = Condition.eq('path1', Condition.path('value1'));
    expect(cond.op).toEqual(ConditionOperator.Equal);
    expect(cond.buildExpression(attribs)).toEqual('#n0 = #n1');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1', '#n1': 'value1' });
    expect(attribs.getValues()).toEqual({});
  });

  it('ne with Path', () => {
    const cond = Condition.ne('path1', Condition.path('value1'));
    expect(cond.op).toEqual(ConditionOperator.NotEqual);
    expect(cond.buildExpression(attribs)).toEqual('#n0 <> #n1');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1', '#n1': 'value1' });
    expect(attribs.getValues()).toEqual({});
  });

  it('lt with Path', () => {
    const cond = Condition.lt('path1', Condition.path('value1'));
    expect(cond.op).toEqual(ConditionOperator.LessThen);
    expect(cond.buildExpression(attribs)).toEqual('#n0 < #n1');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1', '#n1': 'value1' });
    expect(attribs.getValues()).toEqual({});
  });
  it('le with Path', () => {
    const cond = Condition.le('path1', Condition.path('value1'));
    expect(cond.op).toEqual(ConditionOperator.LessThenEqual);
    expect(cond.buildExpression(attribs)).toEqual('#n0 <= #n1');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1', '#n1': 'value1' });
    expect(attribs.getValues()).toEqual({});
  });

  it('gt with Path', () => {
    const cond = Condition.gt('path1', Condition.path('value1'));
    expect(cond.op).toEqual(ConditionOperator.GreaterThen);
    expect(cond.buildExpression(attribs)).toEqual('#n0 > #n1');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1', '#n1': 'value1' });
    expect(attribs.getValues()).toEqual({});
  });

  it('ge with Path', () => {
    const cond = Condition.ge('path1', Condition.path('value1'));
    expect(cond.op).toEqual(ConditionOperator.GreaterThenEqual);
    expect(cond.buildExpression(attribs)).toEqual('#n0 >= #n1');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1', '#n1': 'value1' });
    expect(attribs.getValues()).toEqual({});
  });

  it('between with Path', () => {
    const cond = Condition.between('path1', Condition.path('value1'), Condition.path('value2'));
    expect(cond.op).toEqual(ConditionOperator.Between);
    expect(cond.buildExpression(attribs)).toEqual('#n0 BETWEEN #n1 AND #n2');
    expect(attribs.getPaths()).toEqual({
      '#n0': 'path1',
      '#n1': 'value1',
      '#n2': 'value2',
    });
    expect(attribs.getValues()).toEqual({});
  });

  it('in with Path', () => {
    const cond = Condition.in('path1', [Condition.path('value1'), Condition.path('value2'), Condition.path('value3')]);
    expect(cond.op).toEqual(ConditionOperator.In);
    expect(cond.buildExpression(attribs)).toEqual('#n0 IN (#n1, #n2, #n3)');
    expect(attribs.getPaths()).toEqual({
      '#n0': 'path1',
      '#n1': 'value1',
      '#n2': 'value2',
      '#n3': 'value3',
    });
    expect(attribs.getValues()).toEqual({});
  });
});

describe('Validate LogicalCondition', () => {
  const cond1 = Condition.le('path1', 'value1');
  const cond2 = Condition.ge('path2', 'value2');
  const cond3 = Condition.eq('path3', 3);
  const cond4 = Condition.ne('path4', 4);
  const attribs = new ExpressionAttributes();
  beforeEach(() => {
    attribs.reset();
  });

  it('add Conditions', () => {
    const logical = LogicalCondition.and([cond1, cond2]);
    expect(logical.isAnd()).toEqual(true);
    expect(logical.isOr()).toEqual(false);
    expect(logical.isNot()).toEqual(false);
    expect(logical.buildExpression(attribs)).toEqual('#n0 <= :v0 AND #n1 >= :v1');
  });

  it('add Conditions with add', () => {
    const logical = LogicalCondition.and([cond1, cond2]);
    logical.add(cond3);
    expect(logical.buildExpression(attribs)).toEqual('#n0 <= :v0 AND #n1 >= :v1 AND #n2 = :v2');
  });

  it('or Conditions', () => {
    const logical = LogicalCondition.or([cond1, cond2]);
    expect(logical.isAnd()).toEqual(false);
    expect(logical.isOr()).toEqual(true);
    expect(logical.isNot()).toEqual(false);
    expect(logical.buildExpression(attribs)).toEqual('#n0 <= :v0 OR #n1 >= :v1');
  });

  it('or Conditions with add', () => {
    const logical = LogicalCondition.or([cond1, cond2]);
    logical.add(cond3);
    expect(logical.buildExpression(attribs)).toEqual('#n0 <= :v0 OR #n1 >= :v1 OR #n2 = :v2');
  });

  it('not Conditions', () => {
    const logical = LogicalCondition.not(cond1);
    expect(logical.isAnd()).toEqual(false);
    expect(logical.isOr()).toEqual(false);
    expect(logical.isNot()).toEqual(true);
    expect(logical.buildExpression(attribs)).toEqual('NOT #n0 <= :v0');
  });

  it('not Conditions with add throws', () => {
    const logical = LogicalCondition.not(cond1);
    expect(() => logical.add(cond2)).toThrow();
  });

  it('not Conditions with multiple conditions throws', () => {
    const logical = LogicalCondition.not(cond1);
    logical.conds.push(cond2);
    expect(() => logical.buildExpression(attribs)).toThrow();
  });

  it('and Conditions with < 2 conditions thows', () => {
    const logical = LogicalCondition.and([cond1]);
    expect(() => logical.buildExpression(attribs)).toThrow();
  });

  it('or Conditions with < 2 conditions throws', () => {
    const logical = LogicalCondition.or([cond1]);
    expect(() => logical.buildExpression(attribs)).toThrow();
  });

  it('and with 4 conditions', () => {
    const logical = LogicalCondition.and([cond1, cond2, cond3, cond4]);
    expect(logical.buildExpression(attribs)).toEqual('#n0 <= :v0 AND #n1 >= :v1 AND #n2 = :v2 AND #n3 <> :v3');
  });

  it('and with LogicalConditions', () => {
    const logical1 = LogicalCondition.not(cond1);
    const logical2 = LogicalCondition.and([cond2, cond3]);
    const logical3 = LogicalCondition.and([logical1, logical2]);
    expect(logical3.buildExpression(attribs)).toEqual('(NOT #n0 <= :v0) AND (#n1 >= :v1 AND #n2 = :v2)');
  });

  it('add with Conditions and LogicalConditions', () => {
    const logical1 = LogicalCondition.not(cond1);
    const logical3 = LogicalCondition.and([logical1, cond2, cond3]);
    expect(logical3.buildExpression(attribs)).toEqual('(NOT #n0 <= :v0) AND #n1 >= :v1 AND #n2 = :v2');
  });

  it('or with 4 conditions', () => {
    const logical = LogicalCondition.or([cond1, cond2, cond3, cond4]);
    expect(logical.buildExpression(attribs)).toEqual('#n0 <= :v0 OR #n1 >= :v1 OR #n2 = :v2 OR #n3 <> :v3');
  });

  it('or with LogicalConditions', () => {
    const logical1 = LogicalCondition.not(cond1);
    const logical2 = LogicalCondition.or([cond2, cond3]);
    const logical3 = LogicalCondition.or([logical1, logical2]);
    expect(logical3.buildExpression(attribs)).toEqual('(NOT #n0 <= :v0) OR (#n1 >= :v1 OR #n2 = :v2)');
  });

  it('or with Conditions and LogicalConditions', () => {
    const logical1 = LogicalCondition.not(cond1);
    const logical3 = LogicalCondition.or([logical1, cond2, cond3]);
    expect(logical3.buildExpression(attribs)).toEqual('(NOT #n0 <= :v0) OR #n1 >= :v1 OR #n2 = :v2');
  });
});

describe('Validate buildCondition', () => {
  it('Equal', () => {
    expect(buildCondition('#path', ConditionOperator.Equal, [':v1'])).toEqual('#path = :v1');
  });
  it('NotEqual', () => {
    expect(buildCondition('#path', ConditionOperator.NotEqual, [':v1'])).toEqual('#path <> :v1');
  });
  it('LessThen', () => {
    expect(buildCondition('#path', ConditionOperator.LessThen, [':v1'])).toEqual('#path < :v1');
  });
  it('LessThenEqual', () => {
    expect(buildCondition('#path', ConditionOperator.LessThenEqual, [':v1'])).toEqual('#path <= :v1');
  });
  it('GreaterThen', () => {
    expect(buildCondition('#path', ConditionOperator.GreaterThen, [':v1'])).toEqual('#path > :v1');
  });
  it('GreaterThenEqual', () => {
    expect(buildCondition('#path', ConditionOperator.GreaterThenEqual, [':v1'])).toEqual('#path >= :v1');
  });

  it('And with 2', () => {
    expect(buildCondition('cond1', ConditionOperator.And, ['cond2', 'cond3'])).toEqual('(cond1 AND cond2 AND cond3)');
  });
  it('And with 6', () => {
    expect(buildCondition('cond1', ConditionOperator.And, ['cond2', 'cond3', 'cond4', 'cond5', 'cond6'])).toEqual(
      '(cond1 AND cond2 AND cond3 AND cond4 AND cond5 AND cond6)',
    );
  });

  it('Or with 2', () => {
    expect(buildCondition('cond1', ConditionOperator.Or, ['cond2', 'cond3'])).toEqual('(cond1 OR cond2 OR cond3)');
  });
  it('Or with 6', () => {
    expect(buildCondition('cond1', ConditionOperator.Or, ['cond2', 'cond3', 'cond4', 'cond5', 'cond6'])).toEqual(
      '(cond1 OR cond2 OR cond3 OR cond4 OR cond5 OR cond6)',
    );
  });

  it('Not', () => {
    expect(buildCondition('cond1', ConditionOperator.Not)).toEqual('(NOT cond1)');
  });

  it('Between', () => {
    expect(buildCondition('#path', ConditionOperator.Between, [':v1', ':v2'])).toEqual('#path BETWEEN :v1 AND :v2');
  });

  it('In with 1', () => {
    expect(buildCondition('#path', ConditionOperator.In, [':v1'])).toEqual('#path IN (:v1)');
  });

  // TODO: test up to 100 operands
  it('In with 5', () => {
    expect(buildCondition('#path', ConditionOperator.In, [':v1', ':v2', ':v3', ':v4', ':v5'])).toEqual(
      '#path IN (:v1, :v2, :v3, :v4, :v5)',
    );
  });

  it('BeginsWith', () => {
    expect(buildCondition('#path', ConditionOperator.BeginsWith, [':v1'])).toEqual('begins_with(#path, :v1)');
  });

  it('Contains', () => {
    expect(buildCondition('#path', ConditionOperator.Contains, [':v1'])).toEqual('contains(#path, :v1)');
  });

  it('Type', () => {
    expect(buildCondition('#path', ConditionOperator.Type, [':v1'])).toEqual('attribute_type(#path, :v1)');
  });

  it('Exists', () => {
    expect(buildCondition('#path', ConditionOperator.Exists)).toEqual('attribute_exists(#path)');
  });

  it('NotExists', () => {
    expect(buildCondition('#path', ConditionOperator.NotExists)).toEqual('attribute_not_exists(#path)');
  });

  it('Size', () => {
    expect(buildCondition('#path', ConditionOperator.Size)).toEqual('size(#path)');
  });

  it('buildConditionInput', () => {
    const cond = Condition.eq('path1', 'value1');
    expect(buildConditionInput(cond)).toEqual({
      ConditionExpression: '#n0 = :v0',
      ExpressionAttributeNames: { '#n0': 'path1' },
      ExpressionAttributeValues: { ':v0': 'value1' },
    });
    expect(buildConditionInput(cond, new ExpressionAttributes())).toEqual({
      ConditionExpression: '#n0 = :v0',
      ExpressionAttributeNames: { '#n0': 'path1' },
      ExpressionAttributeValues: { ':v0': 'value1' },
    });
  });
});
