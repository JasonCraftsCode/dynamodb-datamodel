import { ExpressionAttributes } from './ExpressionAttributes';
import { Table } from './Table';

// Note: Using classes to scope static methods, allow use of reserved words (like 'in') as methods and
// let TypeDoc produce more consistent documentation (thought it does mean that Condition which acts
// more as a namespace or module has all static methods).

/**
 * Object passed down to Condition.Resolver functions to support getting path and value aliases and
 * provide context to the resolver function to support advanced condition resolvers.
 */
export class ConditionExpression {
  /**
   * Object for getting path and value aliases.
   */
  attributes: ExpressionAttributes;

  /**
   * Initialize ConditionExpression with existing or new {@link ExpressionAttributes}.
   * @param attributes Object used to get path and value aliases.
   */
  constructor(attributes = new ExpressionAttributes()) {
    this.attributes = attributes;
  }

  /**
   * @see ExpressionAttributes.addPath
   */
  addPath(path: string): string {
    return this.attributes.addPath(path);
  }

  /**
   * @see ExpressionAttributes.addValue
   */
  addValue(value: Table.AttributeValues): string {
    return this.attributes.addValue(value);
  }
}

/**
 * Set of helper methods to build ConditionExpressions used in DynamoDB delete, put and update operations, and
 * FilterExpression used in DynamoDB query and scan operations.  All of the condition based methods return a
 * function in the form of '(exp: ConditionExpression): string' this allow conditions to be composed together
 * and even extended in a very simple way.
 *
 *
 * See [Comparison Operator and Function Reference](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.OperatorsAndFunctions.html)
 * for details on how each of the below comparison operations and functions work.
 *
 *
 * Condition is also used by {@link fields} to allow each field type to only expose the conditions that the field supports.
 *
 *
 * @example
 * ```typescript
 * import { Condition, ConditionExpression } from 'dynamodb-datamodel';
 * // Destructuring methods from Condition to make writing expression very concise
 * const { eq, ne, and, path } = Condition;
 * const condition = and(eq('first', 'john'), eq('last', 'smith'), ne('first', path('nickname')));
 * const exp = new ConditionExpression();
 * const params = {
 *   // (#n0 = :v0 AND #n1 = :v1 AND #n0 <> #n2)
 *   ConditionExpression: condition(exp);,
 *   // { '#n0': first, '#n1': last, '#n2': nickname }
 *   ExpressionAttributeNames: exp.attributes.getPaths(),
 *   // { ':v0': john, ':v1': smith }
 *   ExpressionAttributeValues: exp.attributes.getValues(),
 * };
 * ```
 *
 *
 * Short aliases exist for the compare and {@link inList} conditions:
 *  - {@link eq} = {@link equal}
 *  - {@link ne} = {@link notEqual}
 *  - {@link lt} = {@link lessThen}
 *  - {@link le} = {@link lessThenEqual}
 *  - {@link gt} = {@link greaterThen}
 *  - {@link ge} = {@link greaterThenEqual}
 *  - {@link in} = {@link inList}
 *
 *
 * Note: Condition is a class that contains only static methods to support using javascript reserved words as
 * method names, like '{@link in}'.  Condition is also a namespace to scope the Condition specific typings, like Resolver.
 */
export abstract class Condition {
  /**
   * Determines if a value is a resolver function or a basic type.
   * @param value Path, value or resolver to inspect.
   * @returns True if value is a resolver and false if value is a basic type.
   */
  static isResolver(value: Condition.Path | Condition.Value): value is Condition.Resolver {
    return typeof value === 'function';
  }

  /**
   * Add a path to the {@link ConditionExpression} either directly or by resolving the path.
   * @param path Value to add or add via resolving.
   * @param exp Object to add path to.
   * @returns Generated name alias to use in condition expression.
   */
  static addPath(path: Condition.Path, exp: ConditionExpression): string {
    return Condition.isResolver(path) ? path(exp) : exp.addPath(path);
  }

  /**
   * Add a value to the {@link ConditionExpression}  either directly or by resolving the values.
   * @param values Array of values to add or add via resolving.
   * @param exp Object to add values to.
   * @returns Generated value alias to use in condition expression.
   */
  static addValues(values: Condition.Value[], exp: ConditionExpression): string[] {
    return values.map((value) => (Condition.isResolver(value) ? value(exp) : exp.addValue(value)));
  }

  /**
   * General compare condition used by equal, notEqual, and other comparators.
   * @param left Path to resolve or add.
   * @param op Compare operation to use.
   * @param right Value to resolve or add.
   * @returns Resolver to use when generate condition expression.
   */
  static compare(left: Condition.Path, op: Condition.CompareOperators, right: Condition.Value) {
    return (exp: ConditionExpression): string => {
      const path = Condition.addPath(left, exp);
      const value = Condition.addValues([right], exp);
      return `${path} ${op} ${value}`;
    };
  }

  /**
   * Inserts a path for a value in below conditions methods to allow conditions to compare two fields against each other.
   * @example
   * ```typescript
   * // Expands to: '#n0 = #n1'
   * const condition = Condition.equal('name', Condition.path('name'));
   * ```
   * @param value Path to use for a condition value.
   * @returns Resolver to use when generate condition expression.
   */
  static path(value: string): Condition.Resolver {
    return (exp: ConditionExpression): string => {
      return exp.addPath(value);
    };
  }

  /**
   * Inserts the size of the attribute value to compare the data size to a static value or another attribute value.
   * Supported Types:
   *   - String: length of string.
   *   - Binary: number of bytes in value.
   *   - *Set: number of elements in set.
   *   - Map: number of child elements.
   *   - List: number of child elements.
   * @example
   * ```typescript
   * // Expands to: 'size(#n0) = :v0'
   * const condition = Condition.equal(Condition.size('name'), 4);
   * ```
   * @param path Attribute path to get size of value for.
   * @returns Resolver to use when generate condition expression.
   */
  static size(path: string): Condition.Resolver {
    return (exp: ConditionExpression): string => {
      return `size(${exp.addPath(path)})`;
    };
  }

  /**
   * '=' - Equal condition to compare if an attribute value is equal to a value or another attribute.
   * @example
   * ```typescript
   * // Expands to: '#n0 = :v0'
   * const condition = Condition.equal('name', 'value');
   * ```
   * @param left Path to attribute or size of attribute to compare.
   * @param right Value (or path to attribute) to check if equal to.
   * @returns Resolver to use when generate condition expression.
   */
  static equal(left: Condition.Path, right: Condition.Value): Condition.Resolver {
    return Condition.compare(left, '=', right);
  }
  /**
   * See {@link Condition.equal}
   */
  // eslint-disable-next-line @typescript-eslint/unbound-method
  static eq = Condition.equal;

  /**
   * '<>' - Not equal condition to compare if an attribute value is not equal to a value or another attribute.
   * @example
   * ```typescript
   * // Expands to: '#n0 <> :v0'
   * const condition = Condition.notEqual('name', 'value');
   * ```
   * @param left Path to attribute or size of attribute to compare.
   * @param right Value (or path to attribute) to check if not equal to.
   * @returns Resolver to use when generate condition expression.
   */
  static notEqual(left: Condition.Path, right: Condition.Value): Condition.Resolver {
    return Condition.compare(left, '<>', right);
  }
  /**
   * See {@link Condition.notEqual}
   */
  // eslint-disable-next-line @typescript-eslint/unbound-method
  static ne = Condition.notEqual;

  /**
   * '<' - Less then condition to compare if an attribute value is less then to a value or another attribute.
   * @example
   * ```typescript
   * // Expands to: '#n0 < :v0'
   * const condition = Condition.lessThen('name', 'value');
   * ```
   * @param left Path to attribute or size of attribute to compare.
   * @param right Value (or path to attribute) to check if less then.
   * @returns Resolver to use when generate condition expression.
   */
  static lessThen(left: Condition.Path, right: Condition.Value): Condition.Resolver {
    return Condition.compare(left, '<', right);
  }
  /**
   * See {@link Condition.lessThen}
   */
  // eslint-disable-next-line @typescript-eslint/unbound-method
  static lt = Condition.lessThen;

  /**
   * '<=' - Less then and equal condition to compare if an attribute value is less then and equal to a value or another attribute.
   * @example
   * ```typescript
   * // Expands to: '#n0 <= :v0'
   * const condition = Condition.lessThenEqual('name', 'value');
   * ```
   * @param left Path to attribute or size of attribute to compare.
   * @param right Value (or path to attribute) to check if less then and equal to.
   * @returns Resolver to use when generate condition expression.
   */
  static lessThenEqual(left: Condition.Path, right: Condition.Value): Condition.Resolver {
    return Condition.compare(left, '<=', right);
  }
  /**
   * See {@link Condition.lessThenEqual}
   */
  // eslint-disable-next-line @typescript-eslint/unbound-method
  static le = Condition.lessThenEqual;

  /**
   * '>' - Greater then condition to compare if an attribute value is greater then a value or another attribute.
   * @example
   * ```typescript
   * // Expands to: '#n0 > :v0'
   * const condition = Condition.greaterThen('name', 'value');
   * ```
   * @param left Path to attribute or size of attribute to compare.
   * @param right Value (or path to attribute) to check if greater then.
   * @returns Resolver to use when generate condition expression.
   */
  static greaterThen(left: Condition.Path, right: Condition.Value): Condition.Resolver {
    return Condition.compare(left, '>', right);
  }
  /**
   * See {@link Condition.greaterThen}
   */
  // eslint-disable-next-line @typescript-eslint/unbound-method
  static gt = Condition.greaterThen;

  /**
   * '>=' - Greater then and equal to condition to compare if an attribute value is greater then and equal to a value or another attribute.
   * @example
   * ```typescript
   * // Expands to: '#n0 >= :v0'
   * const condition = Condition.greaterThenEqual('name', 'value');
   * ```
   * @param left Path to attribute or size of attribute to compare.
   * @param right Value (or path to attribute) to check if greater then and equal to.
   * @returns Resolver to use when generate condition expression.
   */
  static greaterThenEqual(left: Condition.Path, right: Condition.Value): Condition.Resolver {
    return Condition.compare(left, '>=', right);
  }
  /**
   * See {@link Condition.greaterThenEqual}
   */
  // eslint-disable-next-line @typescript-eslint/unbound-method
  static ge = Condition.greaterThenEqual;

  /**
   * 'BETWEEN' - Between condition compares if an attribute value is between two values or other attributes.
   * Condition.between('path', 1, 2) will have the same outcome as
   * Condition.and(Condition.greaterThenEqual('path', 1), Condition.lessThenEqual('path', 2))
   * @example
   * ```typescript
   * // Expands to: '#n0 BETWEEN :v0 AND :v1'
   * const condition = Condition.between('name', 1, 2);
   * ```
   * @param path Path to attribute or size of attribute to compare.
   * @param from Value (or path to attribute) to check if greater then and equal to.
   * @param to Value (or path to attribute) to check if less then and equal to.
   * @returns Resolver to use when generate condition expression.
   */
  static between(path: string, from: Condition.Value, to: Condition.Value): Condition.Resolver {
    return (exp: ConditionExpression): string => {
      return `${exp.addPath(path)} BETWEEN ${Condition.addValues([from, to], exp).join(' AND ')}`;
    };
  }

  /**
   * 'IN' - In condition compares the value of an attribute is equal to any of the list values or other attributes
   * @example
   * ```typescript
   * // Expands to: '#n0 IN (:v0, :v1, :v2)'
   * const condition = Condition.inList('name', [1, 2, 3]);
   * ```
   * @param path Path to attribute to get the value from.
   * @param values List of the values to check if equal to path attribute value.
   * @returns Resolver to use when generate condition expression.
   */
  static inList(path: string, values: Condition.Value[]): Condition.Resolver {
    return (exp: ConditionExpression): string => {
      return `${exp.addPath(path)} IN (${Condition.addValues(values, exp).join(', ')})`;
    };
  }
  /**
   * See {@link Condition.inList}
   */
  // eslint-disable-next-line @typescript-eslint/unbound-method
  static in = Condition.inList;

  /**
   * 'contains' Contains function checks if the attribute string or set contains the string value
   * @example
   * ```typescript
   * // Expands to: 'contains(#n0, :v0)'
   * const condition = Condition.contains('name', 'value');
   * ```
   *  Supported Types: String, *Set
   * @param path Path to attribute to get the value from.
   * @param value String to check if the attribute value contains.
   * @returns Resolver to use when generate condition expression.
   */
  static contains(path: string, value: string): Condition.Resolver<'S' | 'SS' | 'NS' | 'BS'> {
    return (exp: ConditionExpression): string => {
      return `contains(${exp.addPath(path)}, ${exp.addValue(value)})`;
    };
  }

  /**
   * 'begins_with' - Begins with function checks to see if a string attribute begins with a string value
   * Supported Types: String
   * @example
   * ```typescript
   * // Expands to: 'begins_with(#n0, :v0)'
   * const condition = Condition.beginsWith('name', 'value');
   * ```
   * @param path Path to attribute to get the value from.
   * @param value String to check if the path attribute value begins with.
   * @returns Resolver to use when generate condition expression.
   */
  static beginsWith(path: string, value: string): Condition.Resolver<'S'> {
    return (exp: ConditionExpression): string => {
      return `begins_with(${exp.addPath(path)}, ${exp.addValue(value)})`;
    };
  }

  /**
   * 'attribute_type' - Attribute type function checks to see if the attribute is of a certain data type.
   * @example
   * ```typescript
   * // Expands to: 'attribute_type(#n0, :v0)'
   * const condition = Condition.type('name', 'S');
   * ```
   * @param path Path to attribute to get the value from.
   * @param type Type to check that the path attribute value matches.
   * @returns Resolver to use when generate condition expression.
   */
  static type(path: string, type: Table.AttributeTypes): Condition.Resolver {
    return (exp: ConditionExpression): string => {
      return `attribute_type(${exp.addPath(path)}, ${exp.addValue(type)})`;
    };
  }

  /**
   * 'attribute_exists' - Attribute exists function check if the attribute exists for the item
   * @example
   * ```typescript
   * // Expands to: 'attribute_exists(#n0)'
   * const condition = Condition.exists('name');
   * ```
   * @param path Path to attribute to get the value from.
   * @returns Resolver to use when generate condition expression.
   */
  static exists(path: string): Condition.Resolver {
    return (exp: ConditionExpression): string => {
      return `attribute_exists(${exp.addPath(path)})`;
    };
  }

  /**
   * 'attribute_not_exists' - Attribute not exists function checks if the attribute does not exists for the item.
   * @example
   * ```typescript
   * // Expands to: 'attribute_not_exists(#n0)'
   * const condition = Condition.notExists('name');
   * ```
   * @param path Path to attribute to get the value from.
   * @returns Resolver to use when generate condition expression.
   */
  static notExists(path: string): Condition.Resolver {
    return (exp: ConditionExpression): string => {
      return `attribute_not_exists(${exp.addPath(path)})`;
    };
  }

  /**
   * 'AND' - And logical evaluations check if all sub condition is true.
   * This condition will be evaluated with an outer '()' to ensure proper order of evaluation.
   * @example
   * ```typescript
   * // Expands to: '(#n0 = :v0 AND #n0 = :v1 AND #n0 = :v2)'
   * const condition = Condition.and(Condition.eq('name', 1), Condition.eq('name', 2), Condition.eq('name', 3));
   * ```
   * @param conditions List of conditions to evaluate with AND
   * @returns Resolver to use when generate condition expression.
   */
  static and(...conditions: Condition.Resolver[]): Condition.Resolver {
    return (exp: ConditionExpression): string => {
      return `(${conditions.map((resolver) => resolver(exp)).join(` AND `)})`;
    };
  }

  /**
   * 'OR' - Or logical evaluations check if at least one sub condition is true.
   * This condition will be evaluated with an outer '()' to ensure proper order of evaluation.
   * @example
   * ```typescript
   * // Expands to: '(#n0 = :v0 OR #n0 = :v1 OR #n0 = :v2)'
   * const condition = Condition.or(Condition.eq('name', 1), Condition.eq('name', 2), Condition.eq('name', 3));
   * ```
   * @param conditions List of conditions to evaluate with OR
   * @returns Resolver to use when generate condition expression.
   */
  static or(...conditions: Condition.Resolver[]): Condition.Resolver {
    return (exp: ConditionExpression): string => {
      return `(${conditions.map((resolver) => resolver(exp)).join(` OR `)})`;
    };
  }

  /**
   * 'NOT' - Not logical evaluations inverts the condition so true is now false or false is now true.
   * This condition will be evaluated with an outer '()' to ensure proper order of evaluation.
   * @example
   * ```typescript
   * // Expands to: '(NOT #n0 = :v0)'
   * const condition = Condition.not(Condition.eq('name', 1));
   * ```
   * @param condition Condition to invert the value of.
   * @returns Resolver to use when generate condition expression.
   */
  static not(condition: Condition.Resolver): Condition.Resolver {
    return (exp: ConditionExpression): string => {
      return `(NOT ${condition(exp)})`;
    };
  }

  /**
   * Expands a list of conditions into an 'AND' expression.
   * This method is different then evaluating the above '{@link and}' method, since it will not surround the condition with '()'.
   * @param conditions List of conditions to evaluate with AND.
   * @param exp Used when evaluation conditions and store the names and values mappings.
   * @returns The list of conditions expanded as a string with 'AND' between each.
   */
  static resolveTopAnd(conditions: Condition.Resolver[], exp: ConditionExpression): string {
    return conditions.map((resolver) => resolver(exp)).join(` AND `);
  }

  /**
   * Helper function to set a 'ConditionExpression' value on the params argument if there are conditions to resolve.
   * @param conditions  List of conditions to evaluate with AND.
   * @param exp Used when evaluation conditions and store the names and values mappings.
   * @param params Params used for DocumentClient put, delete and update methods.
   * @returns The params argument passed in.
   */
  static addAndParam(
    conditions: Condition.Resolver[] | undefined,
    exp: ConditionExpression,
    params: { ConditionExpression?: string },
  ): { ConditionExpression?: string } {
    if (conditions && conditions.length > 0) params.ConditionExpression = Condition.resolveTopAnd(conditions, exp);
    else delete params.ConditionExpression;
    return params;
  }

  /**
   * Helper function to set a 'FilterExpression' value on the params argument if there are conditions to resolve.
   * @param conditions  List of conditions to evaluate with AND.
   * @param exp Used when evaluation conditions and store the names and values mappings.
   * @param params Params used for DocumentClient query and scan methods.
   * @returns The params argument passed in.
   */
  static addAndFilterParam(
    conditions: Condition.Resolver[] | undefined,
    exp: ConditionExpression,
    params: { FilterExpression?: string },
  ): { FilterExpression?: string } {
    if (conditions && conditions.length > 0) params.FilterExpression = Condition.resolveTopAnd(conditions, exp);
    else delete params.FilterExpression;
    return params;
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace, no-redeclare
export namespace Condition {
  /**
   * Supported compare based operators for conditions expressions.
   */
  export type CompareOperators = '=' | '<>' | '<' | '<=' | '>' | '>=';
  /**
   * Supported logical based operators for condition expressions.
   */
  export type LogicalOperators = 'AND' | 'OR' | 'NOT';
  /**
   * Support operators and functions for condition expressions.
   */
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

  /**
   * Resolver function is return by most of the above conditions methods.  Returning a function allows conditions
   * to easily be composable and extensible.  This allows consumers to create higher level conditions that are composed
   * of the above primitive conditions or support any new primitives that AWS would add in the future.
   */
  export type Resolver<T = Table.AttributeTypes> = (exp: ConditionExpression, type?: T) => string;
  /**
   * The value used in the condition methods.  Can either be a primitive DynamoDB value or a Resolver function,
   * which allows for the use of functions like '{@link size}' or reference other attributes.
   */
  export type Value = Table.AttributeValues | Resolver;
  /**
   * The path or name used in the conditions methods.  Can either be a string or a Resolver function, which allows
   * for the use of functions like '{@link size}'.
   */
  export type Path = string | Resolver;
}
