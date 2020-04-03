import { ExpressionAttributeNameMap } from 'aws-sdk/clients/dynamodb';
import { AttributeValue, AttributeValueMap, AttributeType, ConditionOperator } from './Common';
import { ExpressionAttributes } from './ExpressionAttributes';

// TODO: Use schema to validate path types.
export function buildCondition(path: string, op: ConditionOperator, operands?: string[]) {
  switch (op) {
    case ConditionOperator.Equal:
    case ConditionOperator.NotEqual:
    case ConditionOperator.LessThen:
    case ConditionOperator.LessThenEqual:
    case ConditionOperator.GreaterThen:
    case ConditionOperator.GreaterThenEqual:
      return `${path} ${op} ${operands![0]}`;

    case ConditionOperator.And:
    case ConditionOperator.Or:
      return `(${path} ${op} ${operands!.join(` ${op} `)})`;

    case ConditionOperator.Not:
      return `(${op} ${path})`;

    case ConditionOperator.Between:
      return `${path} ${op} ${operands![0]} AND ${operands![1]}`;

    case ConditionOperator.In:
      // TODO: cap operands to 100
      return `${path} ${op} (${operands!.join(', ')})`;

    case ConditionOperator.BeginsWith:
    case ConditionOperator.Contains:
    case ConditionOperator.Type:
      return `${op}(${path}, ${operands![0]})`;

    case ConditionOperator.Exists:
    case ConditionOperator.NotExists:
    case ConditionOperator.Size:
      return `${op}(${path})`;
  }
  throw new Error(`Invalid ConditionOperator ${op}`);
}

export interface BasicCondition {
  readonly op: ConditionOperator;
  buildExpression(attrs: ExpressionAttributes): string;
}

export class LogicalCondition implements BasicCondition {
  readonly op: ConditionOperator;
  readonly conds: BasicCondition[];

  private constructor(op: ConditionOperator, conds: BasicCondition[]) {
    this.op = op;
    this.conds = conds;
  }

  isAnd() {
    return this.op === ConditionOperator.And;
  }

  isOr() {
    return this.op === ConditionOperator.Or;
  }

  isNot() {
    return this.op === ConditionOperator.Not;
  }

  add(cond: BasicCondition) {
    if (this.isNot()) throw new Error('Not only supports a single condition');
    this.conds.concat(cond);
    return this;
  }

  buildExpression(exp: ExpressionAttributes): string {
    const exps = this.conds.map((cond) => {
      switch (cond.op) {
        case ConditionOperator.And:
        case ConditionOperator.Not:
        case ConditionOperator.Or:
          return `(${cond.buildExpression(exp)})`;
        default:
          return cond.buildExpression(exp);
      }
    });
    const op = this.op;
    if (this.isNot()) {
      if (exps.length !== 1) throw new Error(`${op} has ${exps.length} conditions`);
      return `${op} ${exps[0]}`;
    }
    if (exps.length < 2) throw new Error(`${op} only has ${exps.length} conditions`);
    return exps.join(` ${op} `);
  }

  static and(cond: BasicCondition[]) {
    return new LogicalCondition(ConditionOperator.And, cond);
  }

  static or(cond: BasicCondition[]) {
    return new LogicalCondition(ConditionOperator.Or, cond);
  }

  static not(cond: BasicCondition) {
    return new LogicalCondition(ConditionOperator.Not, [cond]);
  }
}

class ConditionExpression {
  attrs: ExpressionAttributes;

  constructor(attrs: ExpressionAttributes) {
    this.attrs = attrs;
  }

  addPath(path: string) {
    return this.attrs.addPath(path);
  }
  addValue(value: AttributeValue) {
    return this.attrs.addValue(value);
  }
}
export type ConditionFunction = (exp: ExpressionAttributes, type?: string) => string;
export function IsConditionFunction(value: any): value is ConditionFunction {
  return typeof value === 'function';
}

export type ConditionValue = AttributeValue | ConditionFunction;
export type ConditionPath = string | ConditionFunction;

export class Condition implements BasicCondition {
  readonly op: ConditionOperator;
  readonly left: ConditionPath;
  readonly values: ConditionValue[];

  private constructor(left: ConditionPath, op: ConditionOperator, values: ConditionValue[] = []) {
    this.op = op;
    this.left = left;
    this.values = values;
  }

  buildExpression(exp: ExpressionAttributes): string {
    const path = IsConditionFunction(this.left) ? this.left(exp) : exp.addPath(this.left);
    const operands = this.values.map((value) => (IsConditionFunction(value) ? value(exp) : exp.addValue(value)));
    return buildCondition(path, this.op, operands);
  }

  static path(value: string): ConditionFunction {
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
  static size(path: string): ConditionFunction {
    return (exp: ExpressionAttributes) => {
      return `size(${exp.addPath(path)})`;
    };
  }

  static eq(left: ConditionPath, right: ConditionValue): Condition {
    return new Condition(left, ConditionOperator.Equal, [right]);
  }
  static equal = Condition.eq;

  static ne(left: ConditionPath, right: ConditionValue): Condition {
    return new Condition(left, ConditionOperator.NotEqual, [right]);
  }
  static notEqual = Condition.ne;

  static lt(left: ConditionPath, right: ConditionValue): Condition {
    return new Condition(left, ConditionOperator.LessThen, [right]);
  }
  static lessThen = Condition.lt;

  static le(left: ConditionPath, right: ConditionValue): Condition {
    return new Condition(left, ConditionOperator.LessThenEqual, [right]);
  }
  static lessThenEqual = Condition.le;

  static gt(left: ConditionPath, right: ConditionValue): Condition {
    return new Condition(left, ConditionOperator.GreaterThen, [right]);
  }
  static greaterThen = Condition.gt;

  static ge(left: ConditionPath, right: ConditionValue): Condition {
    return new Condition(left, ConditionOperator.GreaterThenEqual, [right]);
  }
  static greaterThenEqual = Condition.ge;

  static between(path: string, from: ConditionValue, to: ConditionValue): Condition {
    return new Condition(path, ConditionOperator.Between, [from, to]);
  }

  static in(path: string, value: ConditionValue[]): Condition {
    return new Condition(path, ConditionOperator.In, value);
  }

  // Supported Types: String, *Set
  static contains(path: string, value: string): Condition {
    return new Condition(path, ConditionOperator.Contains, [value]);
  }

  // Supported Types: String
  static beginsWith(path: string, value: string): Condition {
    return new Condition(path, ConditionOperator.BeginsWith, [value]);
  }

  static type(path: string, type: AttributeType): Condition {
    return new Condition(path, ConditionOperator.Type, [type]);
  }

  static exists(path: string): Condition {
    return new Condition(path, ConditionOperator.Exists);
  }

  static notExists(path: string): Condition {
    return new Condition(path, ConditionOperator.NotExists);
  }
}

export function buildConditionInput(
  cond: BasicCondition,
  exp = new ExpressionAttributes(),
):
  | {
      ConditionExpression: string;
      ExpressionAttributeNames: ExpressionAttributeNameMap;
      ExpressionAttributeValues: AttributeValueMap;
    }
  | undefined {
  const condExp = cond.buildExpression(exp);
  if (cond) {
    return {
      ConditionExpression: condExp,
      ExpressionAttributeNames: exp.getPaths(),
      ExpressionAttributeValues: exp.getValues(),
    };
  }
  return;
}
