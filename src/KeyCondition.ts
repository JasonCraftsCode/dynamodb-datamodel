import { Table } from './Table';

/**
 * Set of helper methods to build KeyConditionExpressions used in DynamoDB query and scan operations.
 * All of the condition based methods return a {@link KeyCondition.Resolver} function in the form of
 * '( name: string, exp: KeyCondition.Expression, type?: T,): string' this allow key conditions to be
 * composed together and even extended in a very simple way.
 *
 *
 * See [Key Condition Expression]{@link https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.html#Query.KeyConditionExpressions}
 * for details on how each of the below key comparison operations and functions work.
 *
 *
 * @example
 * ```typescript
 * import { KeyCondition, KeyConditionExpression } from 'dynamodb-datamodel';
 *
 * // [TypeScript] Define table primary key type
 * interface Key {
 *   P: Table.PrimaryKey.PartitionString;
 *   S?: Table.PrimaryKey.SortString;
 * }
 *
 * // Create table object.  Use 'new Table()' if your not using TypeScript.
 * const table = Table.createTable<Key>({
 *   name: 'TestTable',
 *   keyAttributes: {
 *     P: Table.PrimaryKey.StringType,
 *     S: Table.PrimaryKey.StringType,
 *   },
 *   keySchema: {
 *     P: Table.PrimaryKey.PartitionKeyType,
 *     S: Table.PrimaryKey.SortKeyType,
 *   },
 * });
 *
 * // Use KeyCondition to query the table with primary key of 'P-GUID' and sort key between (and including) 'a' and 'z'
 * const key = {
 *   P:'P-GUID',
 *   S: KeyCondition.between('a', 'z')
 * };
 * const results = await table.query(key);
 * ```
 * @public
 */
export class KeyCondition {
  /**
   * General compare key condition used by eq, lt, le, gt, and ge.
   * @example
   * ```typescript
   * // Expands to: '#n0 = :v0 AND #n1 >= :v1'
   * const key = {
   *   P: 'guid',
   *   S: KeyCondition.compare('>=', 'value')
   * }
   * const results = await table.query(key);
   * ```
   * @param T - The type used for the value param.
   * @param op - Compare operation to use: =, \<, \<=. \> or \>=.
   * @param value - Value to compare the sort key value against.
   * @returns Resolver to use when generate key condition expression.
   */
  static compare<T extends Table.AttributeValues>(op: KeyCondition.CompareOperators, value: T): KeyCondition.Resolver {
    return (name: string, exp: KeyCondition.Expression): void =>
      exp.addCondition(`${exp.addPath(name)} ${op} ${exp.addValue(value)}`);
  }

  /**
   * '=' - Equal condition compares if the sort key value is equal to a value.
   * @example
   * ```typescript
   * // Expands to: '#n0 = :v0 AND #n1 = :v1'
   * const key = {
   *   P: 'guid',
   *   S: KeyCondition.eq('value')
   * }
   * const results = await table.query(key);
   * ```
   * @param T - The type used for the value param.
   * @param value - Value to check if equal to.
   * @returns Resolver to use when generate key condition expression.
   */
  static eq<T extends Table.AttributeValues>(value: T): KeyCondition.Resolver {
    return KeyCondition.compare<T>('=', value);
  }

  /**
   * '\<' - Less then condition compares if the sort key value is less then a value.
   * @example
   * ```typescript
   * // Expands to: '#n0 = :v0 AND #n1 < :v1'
   * const key = {
   *   P: 'guid',
   *   S: KeyCondition.lt('value')
   * }
   * const results = await table.query(key);
   * ```
   * @param T - The type used for the value param.
   * @param value - Value to check if less then.
   * @returns Resolver to use when generate key condition expression.
   */
  static lt<T extends Table.AttributeValues>(value: T): KeyCondition.Resolver {
    return KeyCondition.compare<T>('<', value);
  }

  /**
   * '\<=' - Less then or equal to condition compares if the sort key value is less then or equal to a value.
   * @example
   * ```typescript
   * // Expands to: '#n0 = :v0 AND #n1 <= :v1'
   * const key = {
   *   P: 'guid',
   *   S: KeyCondition.le('value')
   * }
   * const results = await table.query(key);
   * ```
   * @param T - The type used for the value param.
   * @param value - Value to check if less then or equal to.
   * @returns Resolver to use when generate key condition expression.
   */
  static le<T extends Table.AttributeValues>(value: T): KeyCondition.Resolver {
    return KeyCondition.compare<T>('<=', value);
  }

  /**
   * '\>' - Greater then condition compares if the sort key value is greater then a value.
   * @example
   * ```typescript
   * // Expands to: '#n0 = :v0 AND #n1 > :v1'
   * const key = {
   *   P: 'guid',
   *   S: KeyCondition.gt('value')
   * }
   * const results = await table.query(key);
   * ```
   * @param T - The type used for the value param.
   * @param value - Value to check if greater then.
   * @returns Resolver to use when generate key condition expression.
   */
  static gt<T extends Table.AttributeValues>(value: T): KeyCondition.Resolver {
    return KeyCondition.compare<T>('>', value);
  }

  /**
   * '\>=' - Greater then or equal to condition compares if the sort key value is greater then or equal to a value.
   * @example
   * ```typescript
   * // Expands to: '#n0 = :v0 AND #n1 >= :v1'
   * const key = {
   *   P: 'guid',
   *   S: KeyCondition.ge('value')
   * }
   * const results = await table.query(key);
   * ```
   * @param T - The type used for the value param.
   * @param value - Value to check if greater then or equal to.
   * @returns Resolver to use when generate key condition expression.
   */
  static ge<T extends Table.AttributeValues>(value: T): KeyCondition.Resolver {
    return KeyCondition.compare<T>('>=', value);
  }

  /**
   * 'BETWEEN' - Between key condition compares if the sort key value is between two values.
   * @example
   * ```typescript
   * // Expands to: '#n0 = :v0 AND #n1 BETWEEN :v1 AND :v2'
   * const key = {
   *   P: 'guid',
   *   S: KeyCondition.between('a', 'z')
   * }
   * const results = await table.query(key);
   * ```
   * @param T - The type used for the from and to param.
   * @param from - Value to check if sort key is greater then and equal to.
   * @param to - Value to check if sort key  is less then and equal to.
   * @returns Resolver to use when generate key condition expression.
   */
  static between<T extends Table.AttributeValues>(from: T, to: T): KeyCondition.Resolver {
    return (name: string, exp: KeyCondition.Expression): void =>
      exp.addCondition(`${exp.addPath(name)} BETWEEN ${exp.addValue(from)} AND ${exp.addValue(to)}`);
  }

  /**
   * 'begins_with' - Begins with function checks to see if the sort key begins with a string value.
   * Supported Types: String
   * @example
   * ```typescript
   * // Expands to: '#n0 = :v0 AND begins_with(#n1, :v1)'
   * const key = {
   *   P: 'guid',
   *   S: KeyCondition.beginsWith('a', 'z')
   * }
   * const results = await table.query(key);
   * ```
   * @param T - The type used for the value param.
   * @param value - String to check if the sort key value begins with.
   * @returns Resolver to use when generate key condition expression.
   */
  static beginsWith(value: string): KeyCondition.Resolver {
    return (name: string, exp: KeyCondition.Expression): void =>
      exp.addCondition(`begins_with(${exp.addPath(name)}, ${exp.addValue(value)})`);
  }
}

/**
 * Namespace for scoping KeyCondition based interfaces and types.
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-namespace, no-redeclare
export namespace KeyCondition {
  /**
   * Supported compare based operators for conditions expressions.
   */
  export type CompareOperators = '=' | '<' | '<=' | '>' | '>=';

  /**
   * Support operators and functions for condition expressions.
   */
  export type Operators = CompareOperators | 'BETWEEN' | 'begins_with';

  /**
   * Expression object used in the key condition resolver to resolve the key condition to an expression.
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
     * Add key condition expression.
     * @param condition - Condition expression to add.
     */
    addCondition(condition: string): void;

    /**
     * Gets the expression from paths, values and conditions added.
     * @returns key condition expression to use KeyConditionExpression param.
     */
    getExpression(): string | void;
  }

  /**
   * Resolver function is return by most of the above KeyConditions methods.  Returning a function allows key conditions
   * to easily be composable and extensible.  This allows consumers to create higher level key conditions that are composed
   * of the above primitive key conditions or support any new primitives that AWS would add in the future.
   * @param T - The type used for the value param.
   * @param name - Name of the primary key attribute to resolve.
   * @param exp - Object to get path and value aliases and store conditions array.
   * @param type - Param to enforce type safety for conditions that only work on certain types.
   */
  export type Resolver<T = Table.PrimaryKey.AttributeTypes> = (name: string, exp: Expression, type?: T) => void;

  /**
   * String key condition resolver.
   */
  export type StringResolver = KeyCondition.Resolver<'S'>;

  /**
   * Number key condition resolver.
   */
  export type NumberResolver = KeyCondition.Resolver<'N'>;

  /**
   * Binary key condition resolver.
   */
  export type BinaryResolver = KeyCondition.Resolver<'B'>;

  /**
   * Support key condition resolvers.
   */
  export type AttributeResolver = StringResolver | NumberResolver | BinaryResolver;
}

/**
 * Object passed down to KeyCondition.Resolver functions to support getting path and value aliases and
 * provide context to the resolver function to support advanced key condition resolvers.
 * @public
 */
export class KeyConditionExpression implements KeyCondition.Expression {
  /**
   * Object for getting path and value aliases.
   */
  attributes: Table.ExpressionAttributes;

  /**
   * Array of conditions expressions.
   * DynamoDB currently only supports two conditions that with an 'AND' between them.
   */
  conditions: string[] = [];

  /**
   * Initialize KeyConditionExpression with existing or new {@link ExpressionAttributes}.
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
  /** @inheritDoc {@inheritDoc (KeyCondition:namespace).Expression.addCondition} */
  addCondition(condition: string): void {
    if (this.conditions.length < 2) this.conditions.push(condition);
  }

  // eslint-disable-next-line tsdoc/syntax
  /** @inheritDoc {@inheritDoc (KeyCondition:namespace).Expression.getExpression} */
  getExpression(): string | void {
    if (this.conditions.length > 0) return this.conditions.join(' AND ');
  }

  /**
   * Create a key condition expression from a primary key.
   * @param key - Primary key value to build the expression from.
   * @param exp - Object used to get path and value aliases and store the key conditions array.
   * @returns A key condition expression to use for the KeyConditionExpression param.
   */
  static buildExpression(key: Table.PrimaryKey.KeyQueryMap, exp: KeyCondition.Expression): string | void {
    Object.keys(key).forEach((name) => {
      const value = key[name];
      if (typeof value === 'function') value(name, exp);
      else KeyCondition.eq(value)(name, exp);
    });
    return exp.getExpression();
  }

  /**
   * Helper function to set a 'KeyConditionExpression' value on the params argument if there are conditions to resolve.
   * @param key - List of conditions to evaluate with AND.
   * @param exp - Used when evaluation conditions and store the names and values mappings.
   * @param params - Params used for DocumentClient query methods.
   * @returns The params argument passed in.
   */
  static addParams(
    params: { KeyConditionExpression?: string },
    attributes: Table.ExpressionAttributes,
    key: Table.PrimaryKey.KeyQueryMap,
  ): void {
    const exp = KeyConditionExpression.buildExpression(key, new KeyConditionExpression(attributes));
    if (exp) params.KeyConditionExpression = exp;
  }
}
