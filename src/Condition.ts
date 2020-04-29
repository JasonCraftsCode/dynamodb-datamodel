import { ExpressionAttributes } from './ExpressionAttributes';
import { Table } from './Table';

export class Condition {
  static isFunction(value: Condition.Path | Condition.Value): value is Condition.Resolver {
    return typeof value === 'function';
  }

  static addPath(path: Condition.Path, exp: ExpressionAttributes): string {
    return Condition.isFunction(path) ? path(exp) : exp.addPath(path);
  }

  static addValues(values: Condition.Value[], exp: ExpressionAttributes): string[] {
    return values.map((value) => (Condition.isFunction(value) ? value(exp) : exp.addValue(value)));
  }

  static compare(left: Condition.Path, op: Condition.CompareOperators, right: Condition.Value) {
    return (exp: ExpressionAttributes): string => {
      const path = Condition.addPath(left, exp);
      const value = Condition.addValues([right], exp);
      return `${path} ${op} ${value}`;
    };
  }

  static path(value: string): Condition.Resolver {
    return (exp: ExpressionAttributes): string => {
      return exp.addPath(value);
    };
  }

  // Supported Types:
  //  - String: length of string
  //  - Binary: number of bytes in value
  //  - *Set: number of elements in set
  //  - Map: number of child elements
  //  - List: number of child elements
  static size(path: string): Condition.Resolver {
    return (exp: ExpressionAttributes): string => {
      return `size(${exp.addPath(path)})`;
    };
  }

  static eq(left: Condition.Path, right: Condition.Value): Condition.Resolver {
    return Condition.compare(left, '=', right);
  }
  // eslint-disable-next-line @typescript-eslint/unbound-method
  static equal = Condition.eq;

  static ne(left: Condition.Path, right: Condition.Value): Condition.Resolver {
    return Condition.compare(left, '<>', right);
  }
  // eslint-disable-next-line @typescript-eslint/unbound-method
  static notEqual = Condition.ne;

  static lt(left: Condition.Path, right: Condition.Value): Condition.Resolver {
    return Condition.compare(left, '<', right);
  }
  // eslint-disable-next-line @typescript-eslint/unbound-method
  static lessThen = Condition.lt;

  static le(left: Condition.Path, right: Condition.Value): Condition.Resolver {
    return Condition.compare(left, '<=', right);
  }
  // eslint-disable-next-line @typescript-eslint/unbound-method
  static lessThenEqual = Condition.le;

  static gt(left: Condition.Path, right: Condition.Value): Condition.Resolver {
    return Condition.compare(left, '>', right);
  }
  // eslint-disable-next-line @typescript-eslint/unbound-method
  static greaterThen = Condition.gt;

  static ge(left: Condition.Path, right: Condition.Value): Condition.Resolver {
    return Condition.compare(left, '>=', right);
  }
  // eslint-disable-next-line @typescript-eslint/unbound-method
  static greaterThenEqual = Condition.ge;

  static between(path: string, from: Condition.Value, to: Condition.Value): Condition.Resolver {
    return (exp: ExpressionAttributes): string => {
      return `${exp.addPath(path)} BETWEEN ${Condition.addValues([from, to], exp).join(' AND ')}`;
    };
  }

  static in(path: string, values: Condition.Value[]): Condition.Resolver {
    return (exp: ExpressionAttributes): string => {
      return `${exp.addPath(path)} IN (${Condition.addValues(values, exp).join(', ')})`;
    };
  }

  // Supported Types: String, *Set
  static contains(path: string, value: string): Condition.Resolver<'S' | 'SS' | 'NS' | 'BS'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (exp: ExpressionAttributes, type?: 'S' | 'SS' | 'NS' | 'BS'): string => {
      return `contains(${exp.addPath(path)}, ${exp.addValue(value)})`;
    };
  }

  // Supported Types: String
  static beginsWith(path: string, value: string): Condition.Resolver<'S'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (exp: ExpressionAttributes, type?: 'S'): string => {
      return `begins_with(${exp.addPath(path)}, ${exp.addValue(value)})`;
    };
  }

  static type(path: string, type: Table.AttributeTypes): Condition.Resolver {
    return (exp: ExpressionAttributes): string => {
      return `attribute_type(${exp.addPath(path)}, ${exp.addValue(type)})`;
    };
  }

  static exists(path: string): Condition.Resolver {
    return (exp: ExpressionAttributes): string => {
      return `attribute_exists(${exp.addPath(path)})`;
    };
  }

  static notExists(path: string): Condition.Resolver {
    return (exp: ExpressionAttributes): string => {
      return `attribute_not_exists(${exp.addPath(path)})`;
    };
  }

  static and(conds: Condition.Resolver[]): Condition.Resolver {
    return (exp: ExpressionAttributes): string => {
      return `(${conds.map((cond) => cond(exp)).join(` AND `)})`;
    };
  }

  static or(conds: Condition.Resolver[]): Condition.Resolver {
    return (exp: ExpressionAttributes): string => {
      return `(${conds.map((cond) => cond(exp)).join(` OR `)})`;
    };
  }

  static not(cond: Condition.Resolver): Condition.Resolver {
    return (exp: ExpressionAttributes): string => {
      return `(NOT ${cond(exp)})`;
    };
  }

  static addAndParam(
    conditions: Condition.Resolver[] | undefined,
    exp: ExpressionAttributes,
    params: { ConditionExpression?: string },
  ): { ConditionExpression?: string } {
    if (conditions && conditions.length > 0)
      params.ConditionExpression = conditions.length === 1 ? conditions[0](exp) : Condition.and(conditions)(exp);
    return params;
  }

  static addAndFilterParam(
    conditions: Condition.Resolver[] | undefined,
    exp: ExpressionAttributes,
    params: { FilterExpression?: string },
  ): { FilterExpression?: string } {
    if (conditions && conditions.length > 0)
      params.FilterExpression = conditions.length === 1 ? conditions[0](exp) : Condition.and(conditions)(exp);
    return params;
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace, no-redeclare
export namespace Condition {
  export type CompareOperators = '=' | '<>' | '<' | '<=' | '>' | '>=';
  export type LogicalOperators = 'AND' | 'OR' | 'NOT';
  export type Operators =
    | CompareOperators
    | 'BETWEEN'
    | 'IN'
    | 'begins_with'
    | 'contains'
    | 'attribute_type'
    | 'attribute_exists'
    | 'attribute_not_exists'
    | 'size'
    | LogicalOperators;

  export type Resolver<T = Table.AttributeTypes> = (exp: ExpressionAttributes, type?: T) => string;
  export type Value = Table.AttributeValues | Resolver;
  export type Path = string | Resolver;
}
