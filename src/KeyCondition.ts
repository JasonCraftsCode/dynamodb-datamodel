import { ExpressionAttributeNameMap } from 'aws-sdk/clients/dynamodb';
import { ExpressionAttributes } from './ExpressionAttributes';
import { Table } from './Table';

export class KeyCondition {
  static eq<T extends Table.PrimaryAttributeValue>(value: T) {
    return KeyCondition.op<T>('=', value);
  }
  static equal = KeyCondition.eq;

  static lt<T extends Table.PrimaryAttributeValue>(value: T) {
    return KeyCondition.op<T>('<', value);
  }
  static lessThen = KeyCondition.lt;

  static le<T extends Table.PrimaryAttributeValue>(value: T) {
    return KeyCondition.op<T>('<=', value);
  }
  static lessThenEqual = KeyCondition.le;

  static gt<T extends Table.PrimaryAttributeValue>(value: T) {
    return KeyCondition.op<T>('>', value);
  }
  static greaterThen = KeyCondition.gt;

  static ge<T extends Table.PrimaryAttributeValue>(value: T) {
    return KeyCondition.op<T>('>=', value);
  }
  static greaterThenEqual = KeyCondition.ge;

  static between<T extends Table.PrimaryAttributeValue>(value: T, and: T) {
    return KeyCondition.op<T>('BETWEEN', value, and);
  }

  static beginsWith(value: string) {
    return KeyCondition.op<string>('begins_with', value);
  }

  static op<T extends Table.PrimaryAttributeValue>(op: Table.SortComparisonOperator, value: T, and?: T) {
    return (name: string, exp: KeyConditionExpression, type?: Table.PrimaryAttributeType): void => {
      exp.addSortCondition(name, op, value, and);
    };
  }

  static buildExpression(key: Table.PrimaryKeyQuery, exp: KeyConditionExpression): string {
    Object.keys(key).forEach((name) => {
      const value = key[name];
      if (typeof value === 'function') {
        value(name, exp);
      } else {
        exp.addEqualCondition(name, value);
      }
    });
    return exp.getExpression();
  }

  static buildInput(
    key: Table.PrimaryKeyQuery,
    exp = new KeyConditionExpression(),
  ): {
    KeyConditionExpression: string;
    ExpressionAttributeNames: ExpressionAttributeNameMap;
    ExpressionAttributeValues: Table.AttributeValueMap;
  } {
    const keyCond = KeyCondition.buildExpression(key, exp);
    return {
      KeyConditionExpression: keyCond,
      ExpressionAttributeNames: exp.attributes.getPaths(),
      ExpressionAttributeValues: exp.attributes.getValues(),
    };
  }
}

export class KeyConditionExpression {
  conditions: string[] = [];
  attributes: ExpressionAttributes;

  constructor(attributes = new ExpressionAttributes()) {
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
    and?: Table.PrimaryAttributeValue,
  ) {
    const n = this.addPath(name);
    const v = this.addValue(value);
    switch (op) {
      case 'BETWEEN':
        return `${n} ${op} ${v} AND ${this.addValue(and!)}`;
      case 'begins_with':
        return `${op}(${n}, ${v})`;
    }
    return `${n} ${op} ${v}`;
  }

  addSortCondition(
    name: string,
    op: Table.SortComparisonOperator,
    value: Table.PrimaryAttributeValue,
    and?: Table.PrimaryAttributeValue,
  ) {
    const cond = this.createSortCondition(name, op, value, and);
    this.addCondition(cond);
  }

  addEqualCondition(name: string, value: Table.PrimaryAttributeValue) {
    this.addSortCondition(name, '=', value);
  }

  addCondition(cond: string) {
    if (this.conditions.length < 2) this.conditions.push(cond);
  }

  getExpression() {
    return this.conditions.join(' AND ');
  }
}
