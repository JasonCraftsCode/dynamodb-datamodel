import {
  Condition,
  ConditionExpression,
  ExpressionAttributes,
  Fields,
  KeyCondition,
  KeyConditionExpression,
  Model,
  Index,
  Table,
  validateTable,
  validateIndex,
  validateIndexes,
  Update,
  UpdateExpression,
} from '../src/index';

it('Validate top level exports', () => {
  expect(typeof Condition).toBe('function');
  expect(typeof ConditionExpression).toBe('function');
  expect(typeof ExpressionAttributes).toBe('function');
  expect(typeof Fields).toBe('function');
  expect(typeof KeyCondition).toBe('function');
  expect(typeof KeyConditionExpression).toBe('function');
  expect(typeof Model).toBe('function');
  expect(typeof Index).toBe('function');
  expect(typeof Table).toBe('function');
  expect(typeof validateTable).toBe('function');
  expect(typeof validateIndex).toBe('function');
  expect(typeof validateIndexes).toBe('function');
  expect(typeof Update).toBe('function');
  expect(typeof UpdateExpression).toBe('function');
});
