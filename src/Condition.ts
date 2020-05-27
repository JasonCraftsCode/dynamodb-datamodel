import { Table } from './Table';

/**
 * Set of helper methods to build ConditionExpressions used in DynamoDB delete, put and update operations, and
 * FilterExpression used in DynamoDB query and scan operations.  All of the condition based methods return a
 * {@link Condition.Resolver}  function in the form of '(exp: ConditionExpression): string' this allow conditions
 * to be composed together and even extended in a very simple way.
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
 * // Destructuring methods from Condition to make writing expression more concise
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
 * Note: Condition is a class that contains only static methods to support using javascript reserved words as
 * method names, like '{@link in}'.  Condition is also a namespace to scope the Condition specific typings, like Resolver.
 * @public
 */
export class Condition {
  /**
   * Inserts a path for a value in below conditions methods to allow conditions to compare two fields against each other.
   * @example
   * ```typescript
   * // Expands to: '#n0 = #n1'
   * const condition = Condition.eq('name', Condition.path('name'));
   * ```
   * @param value - Path to use for a condition value.
   * @returns Resolver to use when generate condition expression.
   */
  static path(value: string): Condition.ValueResolver {
    return (exp: Condition.Expression): string => exp.addPath(value);
  }

  /**
   * Inserts the size of the attribute value to compare the data size to a static value or another attribute value.
   *
   *
   * Supported Types:
   *
   *   - String: length of string.
   *   - Binary: number of bytes in value.
   *   - *Set: number of elements in set.
   *   - Map: number of child elements.
   *   - List: number of child elements.
   *
   * @example
   * ```typescript
   * // Expands to: 'size(#n0) = :v0'
   * const condition = Condition.eq(Condition.size('name'), 4);
   * ```
   * @param path - Attribute path to get size of value for.
   * @returns Resolver to use when generate condition expression.
   */
  static size(path: string): Condition.ValueResolver {
    return (exp: Condition.Expression): string => `size(${exp.addPath(path)})`;
  }

  /**
   * General compare condition used by eq, ne, lt, le, gt, and ge.
   *  @example
   * ```typescript
   * // Expands to: '#n0 <> :v0'
   * const condition = Condition.compare('name', '<>', 'value');
   * ```
   * @param left - Path to resolve or add.
   * @param op - Compare operation to use.
   * @param right - Value to resolve or add.
   * @returns Resolver to use when generate condition expression.
   */
  static compare(left: Condition.Path, op: Condition.CompareOperators, right: Condition.Value): Condition.Resolver {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    return (exp: Condition.Expression): string => `${exp.resolvePath(left)} ${op} ${exp.resolveValues([right])}`;
  }

  /**
   * '=' - Equal condition compares if an attribute value is equal to a value or another attribute.
   * @example
   * ```typescript
   * // Expands to: '#n0 = :v0'
   * const condition = Condition.eq('name', 'value');
   * ```
   * @param left - Path to attribute or size of attribute to compare.
   * @param right - Value (or path to attribute) to check if equal to.
   * @returns Resolver to use when generate condition expression.
   */
  static eq(left: Condition.Path, right: Condition.Value): Condition.Resolver {
    return Condition.compare(left, '=', right);
  }

  /**
   * '\<\>' - Not equal condition compares if an attribute value is not equal to a value or another attribute.
   * @example
   * ```typescript
   * // Expands to: '#n0 <> :v0'
   * const condition = Condition.ne('name', 'value');
   * ```
   * @param left - Path to attribute or size of attribute to compare.
   * @param right - Value (or path to attribute) to check if not equal to.
   * @returns Resolver to use when generate condition expression.
   */
  static ne(left: Condition.Path, right: Condition.Value): Condition.Resolver {
    return Condition.compare(left, '<>', right);
  }

  /**
   * '\<' - Less then condition compares if an attribute value is less then a value or another attribute.
   * @example
   * ```typescript
   * // Expands to: '#n0 < :v0'
   * const condition = Condition.lt('name', 'value');
   * ```
   * @param left - Path to attribute or size of attribute to compare.
   * @param right - Value (or path to attribute) to check if less then.
   * @returns Resolver to use when generate condition expression.
   */
  static lt(left: Condition.Path, right: Condition.Value): Condition.Resolver {
    return Condition.compare(left, '<', right);
  }

  /**
   * '\<=' - Less then or equal to condition compares if an attribute value is less then or equal to a value or another attribute.
   * @example
   * ```typescript
   * // Expands to: '#n0 <= :v0'
   * const condition = Condition.le('name', 'value');
   * ```
   * @param left - Path to attribute or size of attribute to compare.
   * @param right - Value (or path to attribute) to check if less then or equal to.
   * @returns Resolver to use when generate condition expression.
   */
  static le(left: Condition.Path, right: Condition.Value): Condition.Resolver {
    return Condition.compare(left, '<=', right);
  }

  /**
   * '\>' - Greater then condition compares if an attribute value is greater then a value or another attribute.
   * @example
   * ```typescript
   * // Expands to: '#n0 > :v0'
   * const condition = Condition.gt('name', 'value');
   * ```
   * @param left - Path to attribute or size of attribute to compare.
   * @param right - Value (or path to attribute) to check if greater then.
   * @returns Resolver to use when generate condition expression.
   */
  static gt(left: Condition.Path, right: Condition.Value): Condition.Resolver {
    return Condition.compare(left, '>', right);
  }

  /**
   * '\>=' - Greater then or equal to condition compare sif an attribute value is greater then or equal to a value or another attribute.
   * @example
   * ```typescript
   * // Expands to: '#n0 >= :v0'
   * const condition = Condition.ge('name', 'value');
   * ```
   * @param left - Path to attribute or size of attribute to compare.
   * @param right - Value (or path to attribute) to check if greater then or equal to.
   * @returns Resolver to use when generate condition expression.
   */
  static ge(left: Condition.Path, right: Condition.Value): Condition.Resolver {
    return Condition.compare(left, '>=', right);
  }

  /**
   * 'BETWEEN' - Between condition compares if an attribute value is between two values or other attributes.
   * Condition.between('path', 1, 2) will have the same outcome as
   * Condition.and(Condition.ge('path', 1), Condition.le('path', 2))
   * @example
   * ```typescript
   * // Expands to: '#n0 BETWEEN :v0 AND :v1'
   * const condition = Condition.between('name', 1, 2);
   * ```
   * @param path - Path to attribute or size of attribute to compare.
   * @param from - Value (or path to attribute) to check if greater then and equal to.
   * @param to - Value (or path to attribute) to check if less then and equal to.
   * @returns Resolver to use when generate condition expression.
   */
  static between(path: string, from: Condition.Value, to: Condition.Value): Condition.Resolver {
    return (exp: Condition.Expression): string =>
      `${exp.addPath(path)} BETWEEN ${exp.resolveValues([from, to]).join(' AND ')}`;
  }

  /**
   * 'IN' - In condition compares the value of an attribute is equal to any of the list values or other attributes.
   * @example
   * ```typescript
   * // Expands to: '#n0 IN (:v0, :v1, :v2)'
   * const condition = Condition.in('name', [1, 2, 3]);
   * ```
   * @param path - Path to attribute to get the value from.
   * @param values - List of the values to check if equal to path attribute value.
   * @returns Resolver to use when generate condition expression.
   */
  static in(path: string, values: Condition.Value[]): Condition.Resolver {
    return (exp: Condition.Expression): string => `${exp.addPath(path)} IN (${exp.resolveValues(values).join(', ')})`;
  }

  /**
   * 'contains' Contains function checks if the attribute string or set contains the string value.
   * @example
   * ```typescript
   * // Expands to: 'contains(#n0, :v0)'
   * const condition = Condition.contains('name', 'value');
   * ```
   *  Supported Types: String, *Set
   * @param path - Path to attribute to get the value from.
   * @param value - String to check if the attribute value contains.
   * @returns Resolver to use when generate condition expression.
   */
  static contains(path: string, value: string): Condition.Resolver {
    return (exp: Condition.Expression): string => `contains(${exp.addPath(path)}, ${exp.addValue(value)})`;
  }

  /**
   * 'begins_with' - Begins with function checks to see if a string attribute begins with a string value.
   * Supported Types: String
   * @example
   * ```typescript
   * // Expands to: 'begins_with(#n0, :v0)'
   * const condition = Condition.beginsWith('name', 'value');
   * ```
   * @param path - Path to attribute to get the value from.
   * @param value - String to check if the path attribute value begins with.
   * @returns Resolver to use when generate condition expression.
   */
  static beginsWith(path: string, value: string): Condition.Resolver {
    return (exp: Condition.Expression): string => `begins_with(${exp.addPath(path)}, ${exp.addValue(value)})`;
  }

  /**
   * 'attribute_type' - Attribute type function checks to see if the attribute is of a certain data type.
   * @example
   * ```typescript
   * // Expands to: 'attribute_type(#n0, :v0)'
   * const condition = Condition.type('name', 'S');
   * ```
   * @param path - Path to attribute to get the value from.
   * @param type - Type to check that the path attribute value matches.
   * @returns Resolver to use when generate condition expression.
   */
  static type(path: string, type: Table.AttributeTypes): Condition.Resolver {
    return (exp: Condition.Expression): string => `attribute_type(${exp.addPath(path)}, ${exp.addValue(type)})`;
  }

  /**
   * 'attribute_exists' - Attribute exists function check if the attribute exists for the item.
   * @example
   * ```typescript
   * // Expands to: 'attribute_exists(#n0)'
   * const condition = Condition.exists('name');
   * ```
   * @param path - Path to attribute to get the value from.
   * @returns Resolver to use when generate condition expression.
   */
  static exists(path: string): Condition.Resolver {
    return (exp: Condition.Expression): string => `attribute_exists(${exp.addPath(path)})`;
  }

  /**
   * 'attribute_not_exists' - Attribute not exists function checks if the attribute does not exists for the item.
   * @example
   * ```typescript
   * // Expands to: 'attribute_not_exists(#n0)'
   * const condition = Condition.notExists('name');
   * ```
   * @param path - Path to attribute to get the value from.
   * @returns Resolver to use when generate condition expression.
   */
  static notExists(path: string): Condition.Resolver {
    return (exp: Condition.Expression): string => `attribute_not_exists(${exp.addPath(path)})`;
  }

  /**
   * 'AND' - And logical evaluations check if all sub condition is true.
   * This condition will be evaluated with an outer '()' to ensure proper order of evaluation.
   * @example
   * ```typescript
   * // Expands to: '(#n0 = :v0 AND #n0 = :v1 AND #n0 = :v2)'
   * const condition = Condition.and(Condition.eq('name', 1), Condition.eq('name', 2), Condition.eq('name', 3));
   * ```
   * @param conditions - List of conditions to evaluate with AND.
   * @returns Resolver to use when generate condition expression.
   */
  static and(...conditions: Condition.Resolver[]): Condition.Resolver {
    return (exp: Condition.Expression): string =>
      `(${conditions.map((resolver) => resolver(exp, 'BOOL')).join(` AND `)})`;
  }

  /**
   * 'OR' - Or logical evaluations check if at least one sub condition is true.
   * This condition will be evaluated with an outer '()' to ensure proper order of evaluation.
   * @example
   * ```typescript
   * // Expands to: '(#n0 = :v0 OR #n0 = :v1 OR #n0 = :v2)'
   * const condition = Condition.or(Condition.eq('name', 1), Condition.eq('name', 2), Condition.eq('name', 3));
   * ```
   * @param conditions - List of conditions to evaluate with OR
   * @returns Resolver to use when generate condition expression.
   */
  static or(...conditions: Condition.Resolver[]): Condition.Resolver {
    return (exp: Condition.Expression): string =>
      `(${conditions.map((resolver) => resolver(exp, 'BOOL')).join(` OR `)})`;
  }

  /**
   * 'NOT' - Not logical evaluations inverts the condition so true is now false or false is now true.
   * This condition will be evaluated with an outer '()' to ensure proper order of evaluation.
   * @example
   * ```typescript
   * // Expands to: '(NOT #n0 = :v0)'
   * const condition = Condition.not(Condition.eq('name', 1));
   * ```
   * @param condition - Condition to invert the value of.
   * @returns Resolver to use when generate condition expression.
   */
  static not(condition: Condition.Resolver): Condition.Resolver {
    return (exp: Condition.Expression): string => `(NOT ${condition(exp, 'BOOL')})`;
  }
}

/**
 * Is also a namespace for scoping Condition based interfaces and types.
 * @public
 * */
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
   * Expression object used in the condition resolver to resolve the condition to an expression.
   */
  export interface Expression {
    /**
     * See {@link ExpressionAttributes.addPath} for details.
     */
    addPath(path: string): string;

    /**
     * See {@link ExpressionAttributes.addValue} for details.
     */
    addValue(value: Table.AttributeValues): string;

    /**
     * Add a condition path either directly or by resolving the path.
     * @param path - Value to add or add via resolving.
     * @returns Generated name alias to use in condition expression.
     */
    resolvePath(path: Condition.Path): string;

    /**
     * Add a condition value either directly or by resolving the values.
     * @param values - Array of values to add or add via resolving.
     * @returns Generated value alias to use in condition expression.
     */
    resolveValues(values: Condition.Value[]): string[];
  }

  /**
   * Resolver function is return by most of the above Conditions methods.  Returning a function allows conditions
   * to easily be composable and extensible.  This allows consumers to create higher level conditions that are composed
   * of the above primitive conditions or support any new primitives that AWS would add in the future.
   * @param exp - Object to get path and value aliases.
   * @param type - Argument to enforce type safety for conditions that only work on certain types.
   */
  export type Resolver = (exp: Expression, type: 'BOOL') => string;

  /**
   * Value Resolver function is return by the path and size Condition methods.  Returning a function allows conditions
   * to easily be composable and extensible.  This allows consumers to create higher level conditions that are composed
   * of the above primitive conditions or support any new primitives that AWS would add in the future.
   * @param exp - Object to get path and value aliases.
   * @param type - Argument to enforce type safety for conditions that only work on certain types.
   */
  export type ValueResolver = (exp: Expression, type: 'S') => string;

  /**
   * The value used in the condition methods.  Can either be a primitive DynamoDB value or a Resolver function,
   * which allows for the use of functions like '{@link size}' or reference other attributes.
   */
  export type Value<T extends Table.AttributeValues = Table.AttributeValues> = T | ValueResolver;

  /**
   * The path or name used in the conditions methods.  Can either be a string or a Resolver function, which allows
   * for the use of functions like '{@link size}'.
   */
  export type Path = string | ValueResolver;
}

/**
 * Object passed down to Condition.Resolver functions to support getting path and value aliases and
 * provide context to the resolver function to support advanced condition resolvers.
 * @public
 */
export class ConditionExpression implements Condition.Expression {
  /**
   * Object for getting path and value aliases.
   */
  attributes: Table.ExpressionAttributes;

  /**
   * Initialize ConditionExpression with existing or new {@link ExpressionAttributes}.
   * @param attributes - Object used to get path and value aliases.
   */
  constructor(attributes: Table.ExpressionAttributes) {
    this.attributes = attributes;
  }

  /**
   * See {@link ExpressionAttributes.addPath} for details.
   */
  addPath(path: string): string {
    return this.attributes.addPath(path);
  }

  /**
   * See {@link ExpressionAttributes.addValue} for details.
   */
  addValue(value: Table.AttributeValues): string {
    return this.attributes.addValue(value);
  }

  // eslint-disable-next-line tsdoc/syntax
  /** @inheritDoc {@inheritDoc (Condition:namespace).Expression.resolvePath} */
  resolvePath(path: Condition.Path): string {
    return ConditionExpression.isResolver(path) ? path(this, 'S') : this.addPath(path);
  }

  // eslint-disable-next-line tsdoc/syntax
  /** @inheritDoc {@inheritDoc (Condition:namespace).Expression.resolveValues} */
  resolveValues(values: Condition.Value[]): string[] {
    return values.map((value) => (ConditionExpression.isResolver(value) ? value(this, 'S') : this.addValue(value)));
  }

  /**
   * Expands a list of conditions into an 'AND' expression.
   * This method is different then evaluating the above '{@link and}' method, since it will not surround the condition with '()'.
   * @param conditions - List of conditions to evaluate with AND.
   * @param exp - Used when evaluation conditions and store the names and values mappings.
   * @returns The list of conditions expanded as a string with 'AND' between each.
   */
  static buildExpression(conditions: Condition.Resolver[], exp: Condition.Expression): string {
    return conditions.map((resolver) => resolver(exp, 'BOOL')).join(` AND `);
  }

  /**
   * Helper function to set a 'FilterExpression' or 'ConditionExpression' property on the params argument if there are conditions to resolve.
   * @param conditions - List of conditions to evaluate with AND.
   * @param exp - Used when evaluation conditions and store the names and values mappings.
   * @param type - The type of expression to set either 'filter' or 'condition',
   * @param params - Params used for DocumentClient query and scan methods.
   * @returns The params argument passed in.
   */
  static addParams(
    params: { ConditionExpression?: string; FilterExpression?: string },
    attributes: Table.ExpressionAttributes,
    type: 'filter' | 'condition',
    conditions?: Condition.Resolver[],
  ): void {
    if (conditions && conditions.length) {
      const exp = ConditionExpression.buildExpression(conditions, new ConditionExpression(attributes));
      if (type === 'filter') params.FilterExpression = exp;
      else params.ConditionExpression = exp;
    }
  }

  /**
   * Determines if a value is a resolver function or a basic type.
   * @param value - Path, value or resolver to inspect.
   * @returns True if value is a resolver and false if value is a basic type.
   */
  static isResolver(value: Condition.Path | Condition.Value): value is Condition.ValueResolver {
    return typeof value === 'function';
  }
}
