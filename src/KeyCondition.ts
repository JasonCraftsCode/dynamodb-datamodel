import { ExpressionAttributes } from './ExpressionAttributes';
import { Table } from './Table';

export class KeyCondition {
  static eq<T extends Table.AttributeValues>(value: T): KeyCondition.Resolver {
    return KeyCondition.op<T>('=', value);
  }
  static equal = KeyCondition.eq;

  static lt<T extends Table.AttributeValues>(value: T): KeyCondition.Resolver {
    return KeyCondition.op<T>('<', value);
  }
  static lessThen = KeyCondition.lt;

  static le<T extends Table.AttributeValues>(value: T): KeyCondition.Resolver {
    return KeyCondition.op<T>('<=', value);
  }
  static lessThenEqual = KeyCondition.le;

  static gt<T extends Table.AttributeValues>(value: T): KeyCondition.Resolver {
    return KeyCondition.op<T>('>', value);
  }
  static greaterThen = KeyCondition.gt;

  static ge<T extends Table.AttributeValues>(value: T): KeyCondition.Resolver {
    return KeyCondition.op<T>('>=', value);
  }
  static greaterThenEqual = KeyCondition.ge;

  static between<T extends Table.AttributeValues>(value: T, and: T): KeyCondition.Resolver {
    return KeyCondition.op<T>('BETWEEN', value, and);
  }

  static beginsWith(value: string): KeyCondition.Resolver {
    return KeyCondition.op<string>('begins_with', value);
  }

  static op<T extends Table.AttributeValues>(op: KeyCondition.ComparisonOperators, value: T, and?: T) {
    return (name: string, exp: KeyConditionExpression, type?: Table.PrimaryKey.AttributeTypes): void => {
      exp.addSortCondition(name, op, value, and);
    };
  }

  static buildExpression(key: Table.PrimaryKey.KeyQueryMap, exp: KeyConditionExpression): string {
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

  static addParam(
    key: Table.PrimaryKey.KeyQueryMap | undefined,
    exp: ExpressionAttributes,
    params: { KeyConditionExpression?: string },
  ) {
    if (key) {
      const condition = KeyCondition.buildExpression(key, new KeyConditionExpression(exp));
      if (condition) params.KeyConditionExpression = condition;
    }
    return params;
  }
}
/* tslint:disable:no-namespace */
export namespace KeyCondition {
  export type Resolver<T = Table.PrimaryKey.AttributeTypes> = (
    name: string,
    exp: KeyConditionExpression,
    type?: T,
  ) => void;

  export type StringResolver = KeyCondition.Resolver<'S'>;
  export type NumberResolver = KeyCondition.Resolver<'N'>;
  export type BinaryResolver = KeyCondition.Resolver<'B'>;
  export type AttributeResolver = StringResolver | NumberResolver | BinaryResolver;

  export type ComparisonOperators = '=' | '<' | '<=' | '>' | '>=' | 'BETWEEN' | 'begins_with';
}

export class KeyConditionExpression {
  conditions: string[] = [];
  attributes: ExpressionAttributes;

  constructor(attributes = new ExpressionAttributes()) {
    this.attributes = attributes;
  }

  addPath(path: string): string {
    return this.attributes.addPath(path);
  }

  addValue(value: Table.AttributeValues): string {
    return this.attributes.addValue(value);
  }

  createSortCondition(
    name: string,
    op: KeyCondition.ComparisonOperators,
    value: Table.AttributeValues,
    and?: Table.AttributeValues,
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
    op: KeyCondition.ComparisonOperators,
    value: Table.AttributeValues,
    and?: Table.AttributeValues,
  ) {
    const cond = this.createSortCondition(name, op, value, and);
    this.addCondition(cond);
  }

  addEqualCondition(name: string, value: Table.AttributeValues) {
    this.addSortCondition(name, '=', value);
  }

  addCondition(cond: string) {
    if (this.conditions.length < 2) this.conditions.push(cond);
  }

  getExpression() {
    return this.conditions.join(' AND ');
  }
}
