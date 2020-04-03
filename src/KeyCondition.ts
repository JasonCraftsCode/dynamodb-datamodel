import { ExpressionAttributeNameMap } from 'aws-sdk/clients/dynamodb';
import { AttributeValueMap } from './Common';
import { Table } from './Table';
import { ExpressionAttributes } from './ExpressionAttributes';

export class SortKey {
  static eq<T extends Table.PrimaryAttributeValue>(value: T) {
    return SortKey.op<T>(Table.SortComparisonOperator.Equal, value);
  }
  static equal = SortKey.eq;

  static lt<T extends Table.PrimaryAttributeValue>(value: T) {
    return SortKey.op<T>(Table.SortComparisonOperator.LessThen, value);
  }
  static lessThen = SortKey.lt;

  static le<T extends Table.PrimaryAttributeValue>(value: T) {
    return SortKey.op<T>(Table.SortComparisonOperator.LessThenEqual, value);
  }
  static lessThenEqual = SortKey.le;

  static gt<T extends Table.PrimaryAttributeValue>(value: T) {
    return SortKey.op<T>(Table.SortComparisonOperator.GreaterThen, value);
  }
  static greaterThen = SortKey.gt;

  static ge<T extends Table.PrimaryAttributeValue>(value: T) {
    return SortKey.op<T>(Table.SortComparisonOperator.GreaterThenEqual, value);
  }
  static greaterThenEqual = SortKey.ge;

  static between<T extends Table.PrimaryAttributeValue>(value: T, and: T) {
    return SortKey.op<T>(Table.SortComparisonOperator.Between, value, and);
  }

  static beginsWith(value: string) {
    return SortKey.op<string>(Table.SortComparisonOperator.BeginsWidth, value);
  }

  static op<T extends Table.PrimaryAttributeValue>(
    op: Table.SortComparisonOperator,
    value: T,
    and?: T
  ) {
    return (
      name: string,
      exp: KeyConditionExpression,
      type?: Table.PrimaryAttributeType
    ): void => {
      exp.addSortCondition(name, op, value, and);
    };
  }
}

export class KeyConditionExpression {
  conditions: string[] = [];
  attributes: ExpressionAttributes;

  constructor(attributes: ExpressionAttributes = new ExpressionAttributes()) {
    this.attributes = attributes;
  }

  addPath(path: string) {
    return this.attributes.addPath(path);
  }

  addValue(value: Table.PrimaryAttributeValue) {
    return this.attributes.addValue(value);
  }

  createSortCondition(
    name: string,
    op: Table.SortComparisonOperator,
    value: Table.PrimaryAttributeValue,
    and?: Table.PrimaryAttributeValue
  ) {
    const n = this.addPath(name);
    const v = this.addValue(value);
    switch (op) {
      case Table.SortComparisonOperator.Between:
        return `${n} ${op} ${v} AND ${this.addValue(and!)}`;
      case Table.SortComparisonOperator.BeginsWidth:
        return `${op}(${n}, ${v})`;
    }
    return `${n} ${op} ${v}`;
  }

  addSortCondition(
    name: string,
    op: Table.SortComparisonOperator,
    value: Table.PrimaryAttributeValue,
    and?: Table.PrimaryAttributeValue
  ) {
    const cond = this.createSortCondition(name, op, value, and);
    this.addCondition(cond);
  }

  addEqualCondition(name: string, value: Table.PrimaryAttributeValue) {
    this.addSortCondition(name, Table.SortComparisonOperator.Equal, value);
  }

  addCondition(cond: string) {
    if (this.conditions.length < 2) this.conditions.push(cond);
  }

  getExpression() {
    return this.conditions.join(' AND ');
  }
}

export function buildKeyConditionExpression(
  key: Table.PrimaryKeyQuery,
  attr: ExpressionAttributes
): string {
  const exp = new KeyConditionExpression(attr);
  Object.keys(key).forEach(name => {
    const value = key[name];
    if (value === undefined) return;
    if (typeof value === 'function') {
      value(name, exp);
    } else {
      exp.addEqualCondition(name, value);
    }
  });
  return exp.getExpression();
}

export function buildKeyConditionInput(
  key: Table.PrimaryKeyQuery,
  exp = new ExpressionAttributes()
):
  | {
      KeyConditionExpression: string;
      ExpressionAttributeNames: ExpressionAttributeNameMap;
      ExpressionAttributeValues: AttributeValueMap;
    }
  | undefined {
  const keyCond = buildKeyConditionExpression(key, exp);
  if (keyCond) {
    return {
      KeyConditionExpression: keyCond,
      ExpressionAttributeNames: exp.getPaths(),
      ExpressionAttributeValues: exp.getValues(),
    };
  }
  return;
}
