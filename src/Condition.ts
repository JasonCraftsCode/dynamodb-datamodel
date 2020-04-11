import { ExpressionAttributeNameMap } from 'aws-sdk/clients/dynamodb';
import { ExpressionAttributes } from './ExpressionAttributes';
import { Table } from './Table';

export class Condition {
  static isFunction(value: any): value is Condition.ConditionFunction {
    return typeof value === 'function';
  }

  static addPath(path: Condition.ConditionPath, exp: ExpressionAttributes): string {
    return Condition.isFunction(path) ? path(exp) : exp.addPath(path);
  }

  static addValues(values: Condition.ConditionValue[], exp: ExpressionAttributes): string[] {
    return values.map((value) => (Condition.isFunction(value) ? value(exp) : exp.addValue(value)));
  }

  static compare(left: Condition.ConditionPath, op: Table.CompareOperator, right: Condition.ConditionValue) {
    return (exp: ExpressionAttributes) => {
      const path = Condition.addPath(left, exp);
      const value = Condition.addValues([right], exp);
      return `${path} ${op} ${value}`;
    };
  }

  static path(value: string): Condition.ConditionFunction {
    return (exp: ExpressionAttributes) => {
      return exp.addPath(value);
    };
  }

  // Supported Types:
  //  - String: length of string
  //  - Binary: number of bytes in value
  //  - *Set: number of elements in set
  //  - Map: number of child elements
  //  - List: number of child elements
  static size(path: string): Condition.ConditionFunction {
    return (exp: ExpressionAttributes) => {
      return `size(${exp.addPath(path)})`;
    };
  }

  static eq(left: Condition.ConditionPath, right: Condition.ConditionValue): Condition.ConditionFunction {
    return Condition.compare(left, '=', right);
  }
  static equal = Condition.eq;

  static ne(left: Condition.ConditionPath, right: Condition.ConditionValue): Condition.ConditionFunction {
    return Condition.compare(left, '<>', right);
  }
  static notEqual = Condition.ne;

  static lt(left: Condition.ConditionPath, right: Condition.ConditionValue): Condition.ConditionFunction {
    return Condition.compare(left, '<', right);
  }
  static lessThen = Condition.lt;

  static le(left: Condition.ConditionPath, right: Condition.ConditionValue): Condition.ConditionFunction {
    return Condition.compare(left, '<=', right);
  }
  static lessThenEqual = Condition.le;

  static gt(left: Condition.ConditionPath, right: Condition.ConditionValue): Condition.ConditionFunction {
    return Condition.compare(left, '>', right);
  }
  static greaterThen = Condition.gt;

  static ge(left: Condition.ConditionPath, right: Condition.ConditionValue): Condition.ConditionFunction {
    return Condition.compare(left, '>=', right);
  }
  static greaterThenEqual = Condition.ge;

  static between(
    path: string,
    from: Condition.ConditionValue,
    to: Condition.ConditionValue,
  ): Condition.ConditionFunction {
    return (exp: ExpressionAttributes) => {
      return `${exp.addPath(path)} BETWEEN ${Condition.addValues([from, to], exp).join(' AND ')}`;
    };
  }

  static in(path: string, values: Condition.ConditionValue[]): Condition.ConditionFunction {
    return (exp: ExpressionAttributes) => {
      return `${exp.addPath(path)} IN (${Condition.addValues(values, exp).join(', ')})`;
    };
  }

  // Supported Types: String, *Set
  static contains(path: string, value: string): Condition.ConditionFunction<'S' | 'SS' | 'NS' | 'BS'> {
    return (exp: ExpressionAttributes, type?: 'S' | 'SS' | 'NS' | 'BS') => {
      return `contains(${exp.addPath(path)}, ${exp.addValue(value)})`;
    };
  }

  // Supported Types: String
  static beginsWith(path: string, value: string): Condition.ConditionFunction<'S'> {
    return (exp: ExpressionAttributes, type?: 'S') => {
      return `begins_with(${exp.addPath(path)}, ${exp.addValue(value)})`;
    };
  }

  static type(path: string, type: Table.AttributeType): Condition.ConditionFunction {
    return (exp: ExpressionAttributes) => {
      return `attribute_type(${exp.addPath(path)}, ${exp.addValue(type)})`;
    };
  }

  static exists(path: string): Condition.ConditionFunction {
    return (exp: ExpressionAttributes) => {
      return `attribute_exists(${exp.addPath(path)})`;
    };
  }

  static notExists(path: string): Condition.ConditionFunction {
    return (exp: ExpressionAttributes) => {
      return `attribute_not_exists(${exp.addPath(path)})`;
    };
  }

  static and(conds: Condition.ConditionFunction[]): Condition.ConditionFunction {
    return (exp: ExpressionAttributes) => {
      return `(${conds.map((cond) => cond(exp)).join(` AND `)})`;
    };
  }

  static or(conds: Condition.ConditionFunction[]): Condition.ConditionFunction {
    return (exp: ExpressionAttributes) => {
      return `(${conds.map((cond) => cond(exp)).join(` OR `)})`;
    };
  }

  static not(cond: Condition.ConditionFunction): Condition.ConditionFunction {
    return (exp: ExpressionAttributes) => {
      return `(NOT ${cond(exp)})`;
    };
  }

  static buildInput(
    cond: Condition.ConditionFunction,
    exp = new ExpressionAttributes(),
  ): {
    ConditionExpression: string;
    ExpressionAttributeNames: ExpressionAttributeNameMap;
    ExpressionAttributeValues: Table.AttributeValueMap;
  } {
    const condExp = cond(exp);
    return {
      ConditionExpression: condExp,
      ExpressionAttributeNames: exp.getPaths(),
      ExpressionAttributeValues: exp.getValues(),
    };
  }
}

/* tslint:disable:no-namespace */
namespace Condition {
  export type ConditionFunction<T = Table.AttributeType> = (exp: ExpressionAttributes, type?: T) => string;
  export type ConditionValue = Table.AttributeValue | ConditionFunction;
  export type ConditionPath = string | ConditionFunction;
}
