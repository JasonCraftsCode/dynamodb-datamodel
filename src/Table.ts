/**
 * Table.ts contains the classes used to model a single DynamoDB table with both local and global secondary indexes.
 * @packageDocumentation
 */
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Condition, ConditionExpression } from './Condition';
import { ExpressionAttributes } from './ExpressionAttributes';
import { KeyCondition, KeyConditionExpression } from './KeyCondition';
import { Update } from './Update';

function getKeyName(keySchema: Table.PrimaryKey.KeyTypesMap, type: Table.PrimaryKey.KeyTypes): string {
  const keys = Object.keys(keySchema);
  for (const key of keys) {
    if (keySchema[key].keyType === type) {
      return key;
    }
  }
  return '';
}

/**
 * Represents either Global Secondary Index (GSI) or Local Secondary Index (LSI) for a table.  GSI and LSI can be
 * associated with a {@link Table} by add GSI to the {@link Table.globalIndexes} array property and LSI to the {@link Table.localIndexes}
 * array property, either through the {@link Table.constructor} or by calling {@link Table.addGlobalIndexes} or {@link Table.addLocalIndexes}.
 *
 * When the index is added to the Table either through the constructor, addGlobalIndexes or addLocalIndexes each index's
 * {@link init} will be passed the Table it is associated with to support the Index methods:
 * {@link queryParams}, {@link scanParams}, {@link query}, and {@link scan}.
 *
 * Once the GSI and LSI are associated with a table they can be validated using {@link validateTable}.
 *
 * If you are using TypeScript you can use {@link Index.createIndex} to create an Index with strong typing for the primary key.
 * This provides strong types for the {@link Index.keySchema} property, {@link Index.queryParams} and {@link Index.scan} methods.
 *
 * @example Creating global secondary index object
 * ```typescript
 * import { DocumentClient } from 'aws-sdk/clients/dynamodb';
 * import { Index, Table } from 'dynamodb-datamodel';
 *
 * // [TypeScript] Define index primary key type
 * interface GSI0Key {
 *   G0P: Table.PrimaryKey.PartitionString;
 *   G0S?: Table.PrimaryKey.SortString;
 * }
 *
 * // Create index object.  Use 'new Index()' if your not using TypeScript.
 * const gsi0 = Index.createIndex<GSI0Key>({
 *   name: 'GSI0',
 *   keySchema: {
 *     G0P: Table.PrimaryKey.PartitionKeyType,
 *     G0S: Table.PrimaryKey.SortKeyType,
 *   },
 *   projection: { type: 'ALL' },
 * });
 *
 * // gsi0 can then be added to the tables globalIndexes property.
 * ```
 *
 *
 * @example Adding global secondary index to table
 * ```typescript
 * // Continued from previous example
 *
 * // Create DynamoDB DocumentClient
 * const client = new DocumentClient();
 *
 * // [TypeScript] Define table primary key type
 * interface Key {
 *   P: Table.PrimaryKey.PartitionString;
 *   S?: Table.PrimaryKey.SortString;
 * }
 *
 * interface TableAttributes extends Key, GSI0Key {}
 *
 * // Create table object.  Use 'new Table()' if your not using TypeScript.
 * const table = Table.createTable<Key, TableAttributes>({
 *   client,
 *   name: 'TestTable',
 *   keyAttributes: {
 *     P: Table.PrimaryKey.StringType,
 *     S: Table.PrimaryKey.StringType,
 *     G0P: Table.PrimaryKey.StringType,
 *     G0S: Table.PrimaryKey.StringType,
 *   },
 *   keySchema: {
 *     P: Table.PrimaryKey.PartitionKeyType,
 *     S: Table.PrimaryKey.SortKeyType,
 *   },
 *   globalIndexes: [gsi0] as Index[],
 * });
 *
 * // Can call Table methods to directly add items to the table, example:
 * const results = await gsi0.query({ G0P: 'P-guid', G0S: KeyCondition.between('a', 'z') });
 *
 * ```
 */
export class Index {
  // NOTE: If you update the below property docs also update IndexParams.
  /**
   * Name of the table's secondary index, used to set the IndexName for dynamodb scan and query actions.
   */
  name: string;
  /**
   * Schema map for the Secondary Index's primary key, in the form of { <partition key name>: { keyType: 'HASH'} }.
   */
  keySchema: Table.PrimaryKey.KeyTypesMap;
  /**
   * Defines how the other attributes for an entity are projected to the index.
   */
  projection: {
    /**
     * Only relevant when type is 'INCLUDE', list of the attributes to project to the secondary index.
     */
    attributes?: string[];
    /**
     * Defines what general set of attributes are projected into the secondary index.
     */
    type: Table.ProjectionType;
  };
  /**
   * The table this index is associated with.  Used in {@link queryParams}, {@link scanParams}, {@link query}, and {@link scan}.
   */
  table?: Table;

  /**
   * @param params Initialize the Index's name, keySchema and projection properties.
   */
  constructor(params: Index.IndexParams) {
    this.name = params.name;
    this.keySchema = params.keySchema;
    this.projection = params.projection;
  }

  /**
   * Used to initialize the Index with the table to support {@link queryParams}, {@link scanParams}, {@link query}, and {@link scan}.
   * @param table table to initialize the index with.
   */
  init(table: Table): void {
    this.table = table;
  }

  /**
   * @returns The name of the primary (or HASH) key.
   */
  getPartitionKey(): string {
    return getKeyName(this.keySchema, 'HASH');
  }

  /**
   * @returns The name of the sort (or RANGE) key.
   */
  getSortKey(): string {
    return getKeyName(this.keySchema, 'RANGE');
  }

  /**
   * Add the IndexName to query options.
   * @param options Options to add IndexName to.
   * @returns Query options with the IndexName set to the {@link Index.name}.
   */
  getQueryOptions(options: Table.QueryOptions = {}): Table.QueryOptions {
    return { ...options, params: { IndexName: this.name, ...options.params } };
  }

  /**
   * Add the IndexName to scan options.
   * @param options Options to add IndexName to.
   * @returns Scan options with the IndexName set to the {@link Index.name}.
   */
  getScanOptions(options: Table.ScanOptions = {}): Table.ScanOptions {
    return { ...options, params: { IndexName: this.name, ...options.params } };
  }

  /**
   * Creates the params that can be used when calling the [DocumentClient.query]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property} method.
   * @param key Primary key with optional KeyCondition to query the secondary index with.
   * @param options Used in building the query params.
   * @returns DynamoDB query method params containing the table, index, key and options.
   */
  queryParams(key: Table.PrimaryKey.KeyQueryMap, options?: Table.QueryOptions): DocumentClient.QueryInput {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.table!.queryParams(key, this.getQueryOptions(options));
  }

  /**
   * Creates the params that can be used when calling the [DocumentClient.scan]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property} method.
   * @param options Used in building the scan params.
   * @returns DocumentClient scan method's params containing the table, index and options.
   */
  scanParams(options?: Table.ScanOptions): DocumentClient.ScanInput {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.table!.scanParams(this.getScanOptions(options));
  }

  /**
   * Wrapper around [DocumentClient.query]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property}
   * method that uses the index and table properties with the key and options params.
   * @param key Primary key with optional KeyCondition to query the secondary index with.
   * @param options Used in building the query params.
   * @returns Promise with the query results, including items fetched.
   */
  query(key: Table.PrimaryKey.KeyQueryMap, options?: Table.QueryOptions): Promise<DocumentClient.QueryOutput> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.table!.query(key, this.getQueryOptions(options));
  }
  /**
   * Wrapper around [DocumentClient.scan]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property}
   * method that uses the index and table properties with the options param.
   * @param options Used in building the scan params.
   * @returns Promise with the scan results, including items fetched.
   */
  scan(options?: Table.ScanOptions): Promise<DocumentClient.ScanOutput> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.table!.scan(this.getScanOptions(options));
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace, no-redeclare
export namespace Index /* istanbul ignore next: needed for ts with es5 */ {
  // NOTE: if you update the docs for the properties of IndexParams also update the docs for Index properties.
  /**
   * Used in {@link Index constructor}.
   */
  export interface IndexParams {
    /**
     * Name of the table's secondary index, used to set the IndexName for dynamodb scan and query actions.
     */
    name: string;
    /**
     * Schema map for the Secondary Index's primary key, in the form of { <partition key name>: { keyType: 'HASH'} }.
     */
    keySchema: Table.PrimaryKey.KeyTypesMap;
    /**
     * Defines how the other attributes for an entity are projected to the index.
     */
    projection: {
      /**
       * Only relevant when type is 'INCLUDE', list of the attributes to project to the secondary index.
       */
      attributes?: string[];
      /**
       * Defines what general set of attributes are projected into the secondary index.
       */
      type: Table.ProjectionType;
    };
  }

  /**
   * Default and Example global secondary index primary key with the generalized compact format of.
   */
  export interface DefaultGlobalIndexKey {
    /**
     * Partition key: G#P which represents G = Global + # = index number + P = Partition key.
     */
    G0P: Table.PrimaryKey.PartitionString;
    /**
     * Sort key: G#S which represents G = Global + # = index number + S = Sort key. The sort key is optional
     * to support the sort key as being option for queryParams and query methods.
     */
    G0S?: Table.PrimaryKey.SortString;
  }

  /**
   * Default and Example local secondary index primary key with the generalized compact format of.
   */
  export interface DefaultLocalIndexKey {
    /**
     * Partition key: P which is the Table partition key since local secondary indexes are stored in the
     * same partition as the main table.
     */
    P: Table.PrimaryKey.PartitionString;
    /**
     * Sort key: L#S which represents L = Local + # = index number + S = Sort key.  The sort key is optional
     * to support the sort key as being option for queryParams and query methods.
     */
    L0S?: Table.PrimaryKey.SortString;
  }

  /**
   * Index constructor param for the generic form of {@link IndexParams}.
   * @typeParam KEY The interface of the index's primary key.
   */
  export interface IndexParamsT<KEY> extends IndexParams {
    /**
     * Generic form of {@link IndexParam.keySchema}.
     */
    keySchema: Table.PrimaryKey.KeyTypesMapT<KEY>;
  }

  /**
   * Generic form of {@link Index}.
   * @typeParam KEY The interface of the index's primary key.
   */
  export interface IndexT<KEY = DefaultGlobalIndexKey> extends Index {
    /**
     * Generic form of {@link Index.keySchema}.
     */
    keySchema: Table.PrimaryKey.KeyTypesMapT<KEY>;

    /**
     * @see Generic form of {@link Index.queryParams}.
     */
    queryParams(key: Table.PrimaryKey.KeyQueryMapT<KEY>, options?: Table.QueryOptions): DocumentClient.QueryInput;
    /**
     * @see Generic form of {@link Index.query}.
     */
    query(key: Table.PrimaryKey.KeyQueryMapT<KEY>, options?: Table.QueryOptions): Promise<DocumentClient.QueryOutput>;
  }

  /**
   * Creates the generic form of Index used in TypeScript to get strong typing.
   *
   * See {@link Table.createTable} reasoning for having a createTable over support 'new TableT'.
   * @param params Index constructor params.
   */
  // eslint-disable-next-line no-inner-declarations
  export function createIndex<KEY = DefaultGlobalIndexKey>(params: IndexParamsT<KEY>): IndexT<KEY> {
    return new Index(params) as IndexT<KEY>;
  }
}

/**
 * Object that represents the DynamoDB table.
 *
 * @example
 * ```typescript
 * import { DocumentClient } from 'aws-sdk/clients/dynamodb';
 * import { Table } from 'dynamodb-datamodel';
 *
 * // Create DynamoDB DocumentClient
 * const client = new DocumentClient();
 *
 * // [TypeScript] Define table primary key type
 * interface Key {
 *   P: Table.PrimaryKey.PartitionString;
 *   S?: Table.PrimaryKey.SortString;
 * }
 *
 * // Create table object.  Use 'new Table()' if your not using TypeScript.
 * const table = Table.createTable<Key>({
 *   client,
 *   name: 'TestTable',
 *   keyAttributes: {
 *     P: Table.PrimaryKey.StringType,
 *     S: Table.PrimaryKey.StringType,
 *   },
 *   keySchema: {
 *     P: Table.PrimaryKey.PartitionKeyType,
 *     S: Table.PrimaryKey.SortKeyType,
 *   },
 *   // Global and local secondary indexes can be added to globalIndexes and localIndexes respectively.
 * });
 *
 * // Can call Table methods to directly add items to the table, example:
 * const results = await table.get({ P: 'P-guid', S: 'S-value' });
 * ```
 */
export class Table {
  private _client?: DocumentClient;
  private _createClient: () => DocumentClient;

  /**
   * Name of the DynamoDB table, used to set the TableName when calling DynamoDB methods.
   */
  name: string;
  /**
   * Definition of the attribute types required for table and index primary key and for index projected attributes.
   * These need to be defined at the table level since the attributes are table wide concept.
   */
  keyAttributes: Table.PrimaryKey.AttributeTypesMap;
  /**
   * Schema map for the Table's primary key, in the form of { <partition key name>: { keyType: 'HASH'} }.
   */
  keySchema: Table.PrimaryKey.KeyTypesMap;
  /**
   * List of the global secondary indexes (GSI) for the table.
   */
  globalIndexes: Index[] = [];
  /**
   * List of the local secondary indexes (LSI) for the table.
   */
  localIndexes: Index[] = [];
  /**
   * Determines how errors should be handled.
   * The default is to throw on any errors.
   */
  onError: (msg: string) => void = (msg: string) => {
    throw new Error(msg);
  };

  /**
   * @param params Initialize the Table's name, attributes, keySchema and index properties.
   */
  constructor(params: Table.TableParams) {
    this.name = params.name;
    this.keyAttributes = params.keyAttributes;
    this.keySchema = params.keySchema;
    if (params.globalIndexes) this.addGlobalIndexes(params.globalIndexes);
    if (params.localIndexes) this.addLocalIndexes(params.localIndexes);
    this._createClient =
      typeof params.client === 'function' ? params.client : (): DocumentClient => params.client as DocumentClient;
  }

  /**
   * @returns The DocumentClient used for all Table operations.
   */
  get client(): DocumentClient {
    if (!this._client) this._client = this._createClient();
    return this._client;
  }

  /**
   * Add global secondary indexes for the Table and initialize the index.
   * @param gsi List of global secondary indexes to add to the table.
   */
  addGlobalIndexes(gsi: Index[]): void {
    gsi.forEach((index) => index.init(this));
    this.globalIndexes = this.globalIndexes.concat(gsi);
  }

  /**
   * Add local secondary indexes for the Table and initialize the index.
   * @param gsi List of local secondary indexes to add to the table.
   */
  addLocalIndexes(lsi: Index[]): void {
    lsi.forEach((index) => index.init(this));
    this.localIndexes = this.localIndexes.concat(lsi);
  }

  /**
   * @returns The name of the primary (or HASH) key attribute.
   */
  getPartitionKey(): string {
    return getKeyName(this.keySchema, 'HASH');
  }

  /**
   * @returns The name of the sort (or RANGE) key attribute.
   */
  getSortKey(): string {
    return getKeyName(this.keySchema, 'RANGE');
  }

  /**
   * Wrapper around the [DocumentClient.createSet]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#createSet-property}
   * used by the below create*Set methods to create type safe sets. Choose to leverage DocumentClient
   * implementation of set to allow DocumentClient to correctly auto convert to DynamoDB's native types.
   * @param list Array of items to create the set from.
   * @param options Options to pass DocumentClient createSet.
   */
  createSet(
    list: string[] | number[] | Table.BinaryValue[],
    options?: DocumentClient.CreateSetOptions,
  ): Table.AttributeSetValues {
    return this.client.createSet(list, options);
  }

  /**
   * Create a string set from a string array.
   * @param list String array to create set from.
   * @param options Options to pass DocumentClient createSet.
   */
  createStringSet(list: string[], options?: DocumentClient.CreateSetOptions): Table.StringSetValue {
    return this.createSet(list, options) as Table.StringSetValue;
  }

  /**
   * Create a number set from a number array.
   * @param list Number array to create set from.
   * @param options Options to pass DocumentClient createSet.
   */
  createNumberSet(list: number[], options?: DocumentClient.CreateSetOptions): Table.NumberSetValue {
    return this.createSet(list, options) as Table.NumberSetValue;
  }

  /**
   * Create a binary set from a binary array.
   * @param list Binary array to create set from.
   * @param options Options to pass DocumentClient createSet.
   */
  createBinarySet(list: Table.BinaryValue[], options?: DocumentClient.CreateSetOptions): Table.BinarySetValue {
    return this.createSet(list, options) as Table.BinarySetValue;
  }

  // Action Params:
  /**
   * Creates the params that can be used when calling [DocumentClient.get]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#get-property}.
   * @param key Primary key of item to get.
   * @param options Additional optional options to use for get.
   * @returns Input params for [DocumentClient.get]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#get-property}.
   */
  getParams(key: Table.PrimaryKey.AttributeValuesMap, options: Table.GetOptions = {}): Table.GetInput {
    return {
      ...options.params,
      TableName: this.name,
      Key: key,
    };
  }

  /**
   * Creates the params that can be used when calling [DocumentClient.delete]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#delete-property}.
   * @param key Primary key of item to delete.
   * @param options Additional optional options to use for delete.
   * @returns Input params for [DocumentClient.delete]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#delete-property}.
   */
  deleteParams(
    key: Table.PrimaryKey.AttributeValuesMap,
    options: Table.DeleteOptions = {},
  ): DocumentClient.DeleteItemInput {
    const params: DocumentClient.DeleteItemInput = {
      ...options.params,
      TableName: this.name,
      Key: key,
    };
    const attributes = options.attributes || new ExpressionAttributes();
    Condition.addAndParam(options.conditions, new ConditionExpression(attributes), params);
    attributes.addParams(params);
    return params;
  }

  /**
   * Get the condition that is needed to support a specific PutWriteOptions.
   * @param options Type of put to get the condition for.
   * @returns Condition resolver that maps to the PutWriteOptions.
   */
  getPutCondition(options: Table.PutWriteOptions): Condition.Resolver | void {
    if (options === 'Exists') return Condition.exists(this.getPartitionKey());
    if (options === 'NotExists') return Condition.notExists(this.getPartitionKey());
  }

  // Consider having writeOptions default to be 'NotExists'
  /**
   * Creates the params that can be used when calling [DocumentClient.put]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property}.
   * @param key Primary key of item to put.
   * @param item Attributes of the item to put.
   * @param options Additional optional options to use for put.
   * @returns Input params for [DocumentClient.put]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property}.
   */
  putParams(
    key: Table.PrimaryKey.AttributeValuesMap,
    item?: Table.AttributeValuesMap,
    options: Table.PutOptions = {},
  ): DocumentClient.PutItemInput {
    const params: DocumentClient.PutItemInput = {
      ...options.params,
      TableName: this.name,
      Item: { ...key, ...item },
    };
    const conditions = options.conditions || [];
    const condition = this.getPutCondition(options.writeOptions || 'Always');
    if (condition) conditions.push(condition);
    const attributes = options.attributes || new ExpressionAttributes();
    Condition.addAndParam(conditions, new ConditionExpression(attributes), params);
    attributes.addParams(params);
    return params;
  }

  /**
   * Creates the params that can be used when calling [DocumentClient.update]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#update-property}.
   * @param key Primary key of item to update.
   * @param item Attributes of the item to update.
   * @param options Additional optional options to use for update.
   * @returns Input params for [DocumentClient.update]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#update-property}.
   */
  updateParams(
    key: Table.PrimaryKey.AttributeValuesMap,
    item?: Update.UpdateMapValue,
    options: Table.UpdateOptions = {},
  ): DocumentClient.UpdateItemInput {
    const params: DocumentClient.UpdateItemInput = {
      ...options.params,
      TableName: this.name,
      Key: key,
    };
    const attributes = options.attributes || new ExpressionAttributes();
    Update.addParam(item, attributes, params);
    Condition.addAndParam(options.conditions, new ConditionExpression(attributes), params);
    attributes.addParams(params);
    return params;
  }

  /**
   * Creates the params that can be used when calling [DocumentClient.query]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property} method.
   * @param key Primary key with optional KeyCondition to query the table with.
   * @param options Used in building the query params.
   * @returns Input params for [DocumentClient.query]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property}.
   */
  queryParams(key: Table.PrimaryKey.KeyQueryMap, options: Table.QueryOptions = {}): DocumentClient.QueryInput {
    const params: DocumentClient.QueryInput = {
      ...options.params,
      TableName: this.name,
    };
    const attributes = options.attributes || new ExpressionAttributes();
    KeyCondition.addParam(key, new KeyConditionExpression(attributes), params);
    Condition.addAndFilterParam(options.conditions, new ConditionExpression(attributes), params);
    attributes.addParams(params);
    return params;
  }

  /**
   * Creates the params that can be used when calling [DocumentClient.scan]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property} method.
   * @param options Used in building the scan params.
   * @returns Input params for [DocumentClient.scan]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property} method.
   */
  scanParams(options: Table.ScanOptions = {}): DocumentClient.ScanInput {
    const params: DocumentClient.ScanInput = {
      ...options.params,
      TableName: this.name,
    };
    const attributes = options.attributes || new ExpressionAttributes();
    Condition.addAndFilterParam(options.conditions, new ConditionExpression(attributes), params);
    attributes.addParams(params);
    return params;
  }

  // actions:
  /**
   * Wrapper method for [DocumentClient.get]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#get-property} method.
   * @param key Primary key of item to get.
   * @param options Additional optional options to use for get.
   * @returns Async promise returned by [DocumentClient.get]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#get-property} method.
   */
  get(key: Table.PrimaryKey.AttributeValuesMap, options?: Table.GetOptions): Promise<DocumentClient.GetItemOutput> {
    return this.client.get(this.getParams(key, options)).promise();
  }

  /**
   * Wrapper method for [DocumentClient.delete]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#delete-property} method.
   * @param key Primary key of item to delete.
   * @param options Additional optional options to use for delete.
   * @returns Async promise returned by [DocumentClient.delete]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#delete-property} method.
   */
  delete(
    key: Table.PrimaryKey.AttributeValuesMap,
    options?: Table.DeleteOptions,
  ): Promise<DocumentClient.DeleteItemOutput> {
    return this.client.delete(this.deleteParams(key, options)).promise();
  }

  /**
   * Wrapper method for [DocumentClient.put]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property} method.
   * @param key Primary key of item to put.
   * @param item Attributes of the item to put.
   * @param options Additional optional options to use for put.
   * @returns Async promise returned by [DocumentClient.put]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property} method.
   */
  put(
    key: Table.PrimaryKey.AttributeValuesMap,
    items?: Table.AttributeValuesMap,
    options?: Table.PutOptions,
  ): Promise<DocumentClient.PutItemOutput> {
    return this.client.put(this.putParams(key, items, options)).promise();
  }

  /**
   * Wrapper method for [DocumentClient.update]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#update-property} method.
   * @param key Primary key of item to update.
   * @param item Attributes of the item to update.
   * @param options Additional optional options to use for update.
   * @returns Async promise returned by [DocumentClient.update]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#update-property} method.
   */
  update(
    key: Table.PrimaryKey.AttributeValuesMap,
    items?: Update.UpdateMapValue,
    options?: Table.UpdateOptions,
  ): Promise<DocumentClient.UpdateItemOutput> {
    return this.client.update(this.updateParams(key, items, options)).promise();
  }

  /**
   * Wrapper around [DocumentClient.query]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property}.
   * method that uses the index and table properties with the key and options params.
   * @param key Primary key with optional KeyCondition to query the secondary index with.
   * @param options Used in building the query params.
   * @returns Promise with the query results, including items fetched.
   */
  query(key: Table.PrimaryKey.KeyQueryMap, options?: Table.QueryOptions): Promise<DocumentClient.QueryOutput> {
    return this.client.query(this.queryParams(key, options)).promise();
  }

  /**
   * Wrapper around [DocumentClient.scan]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property}.
   * method that uses the index and table properties with the options param.
   * @param options Used in building the scan params.
   * @returns Promise with the scan results, including items fetched.
   */
  scan(options?: Table.ScanOptions): Promise<DocumentClient.ScanOutput> {
    return this.client.scan(this.scanParams(options)).promise();
  }

  /**
   * Maps PutWriteOptions to one of the put based ItemActions used by Fields to tell the type of put operation.
   * @param options Put write option to map into a put item action.
   */
  static getPutAction(options?: Table.PutWriteOptions): Table.PutItemActions {
    if (options === 'NotExists') return 'put-new';
    if (options === 'Exists') return 'put-replace';
    return 'put';
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace, no-redeclare
export namespace Table /* istanbul ignore next: needed for ts with es5 */ {
  // export type PromiseResult<D, E> = D & { $response: Response<D, E> };
  /**
   * TypeScript utility type that constructs a type consisting of all properties of T set to optional.
   * Does the opposite of [Required]{@link https://www.typescriptlang.org/docs/handbook/utility-types.html#requiredt}.
   */
  export type Optional<T> = { [P in keyof T]?: T[P] };

  /**
   * Attribute types support by {@link Table} and [DocumentClient]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html}.
   */
  export type AttributeTypes = 'B' | 'N' | 'S' | 'BOOL' | 'NULL' | 'L' | 'M' | 'BS' | 'NS' | 'SS';

  /**
   * Binary value supported by {@link Table} and [DocumentClient]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html}.
   */
  export type BinaryValue = DocumentClient.binaryType;

  /**
   * String set value supported by {@link Table} and [DocumentClient]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html}.
   */
  export type StringSetValue = DocumentClient.StringSet;

  /**
   * Number set value supported by {@link Table} and [DocumentClient]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html}.
   */
  export type NumberSetValue = DocumentClient.NumberSet;

  /**
   * Binary set value supported by {@link Table} and [DocumentClient]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html}.
   */
  export type BinarySetValue = DocumentClient.BinarySet;

  /**
   * Map value supported by {@link Table} and [DocumentClient]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html}.
   */
  export type MapValue = { [key: string]: AttributeValues };

  /**
   * List value supported by {@link Table} and [DocumentClient]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html}.
   */
  export type ListValue = AttributeValues[];

  /**
   * Supported Table set based values.
   */
  export type AttributeSetValues = StringSetValue | NumberSetValue | BinarySetValue;

  /**
   * Supported Table attribute values.
   */
  export type AttributeValues =
    | null
    | string
    | number
    | boolean
    | BinaryValue
    | AttributeSetValues
    | MapValue
    | ListValue;

  /**
   * Supported Table value map used for {@link put} method.
   */
  export type AttributeValuesMap = { [key: string]: AttributeValues };

  /**
   * Put based item actions, used by {@link Fields} to determine what put based table operation will be executed.
   */
  export type PutItemActions = 'put' | 'put-new' | 'put-replace';
  /**
   * Item actions used by {@link Fields} to determine what table operation will be executed.
   */
  export type ItemActions = 'get' | 'delete' | PutItemActions | 'update';

  /**
   * Params used to construct a {@link Table}.
   */
  export interface TableParams {
    /**
     * Name of the DynamoDB table, used to set the TableName when calling DynamoDB methods.
     */
    name: string;

    /**
     * Definition of the attribute types required for table and index primary key and for index projected attributes.
     * These need to be defined at the table level since the attributes are table wide concept.
     */
    keyAttributes: Table.PrimaryKey.AttributeTypesMap;

    /**
     * Schema map for the Table's primary key, in the form of { <partition key name>: { keyType: 'HASH'} }.
     */
    keySchema: Table.PrimaryKey.KeyTypesMap;

    /**
     * List of the global secondary indexes (GSI) for the table.
     */
    globalIndexes?: Index[];

    /**
     * List of the local secondary indexes (LSI) for the table.
     */
    localIndexes?: Index[];

    /**
     * DocumentClient to use in the {@link Table}.  Can be a function to support creating the DocumentClient on demand.
     */
    client: DocumentClient | (() => DocumentClient);

    /**
     * Determines how errors should be handled.
     */
    onError?: (msg: string) => void;
  }

  /**
   * Contains the primary key type and key type values.  Used when definition {@link Table.keyAttributes},
   * {@link Table.keySchema} and {@link Index.keySchema}
   */
  export class PrimaryKey {
    /**
     * Use for defining string based {@link Table.keyAttributes}
     */
    static readonly StringType: { type: 'S' } = { type: 'S' };

    /**
     * Use for defining number based {@link Table.keyAttributes}
     */
    static readonly NumberType: { type: 'N' } = { type: 'N' };

    /**
     * Use for defining binary based {@link Table.keyAttributes}
     */
    static readonly BinaryType: { type: 'B' } = { type: 'B' };

    /**
     * Use for defining partition (HASH) key {@link Table.keySchema} or {@link Index.keySchema}
     */
    static readonly PartitionKeyType: { keyType: 'HASH' } = { keyType: 'HASH' };

    /**
     * Use for defining sort (RANGE) key {@link Table.keySchema} or {@link Index.keySchema}
     */
    static readonly SortKeyType: { keyType: 'RANGE' } = { keyType: 'RANGE' };
  }

  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace PrimaryKey {
    /**
     * Support primary key attribute values types.
     */
    export type AttributeValues = string | number | Table.BinaryValue;

    // ScalarAttributeType
    /**
     * Supported primary key attribute types.
     */
    export type AttributeTypes = 'B' | 'N' | 'S';

    /**
     * Supported primary key types.
     */
    export type KeyTypes = 'HASH' | 'RANGE';

    /**
     * Definition for partition string.  Used for defining the primary key for Tables and Indexes
     */
    export type PartitionString = string | { type: 'S' } | { keyType: 'HASH' };

    /**
     * Definition for partition number.  Used for defining the primary key for Tables and Indexes
     */
    export type PartitionNumber = number | { type: 'N' } | { keyType: 'HASH' };

    /**
     * Definition for partition number.  Used for defining the primary key for Tables and Indexes
     */
    export type PartitionBinary = Table.BinaryValue | { type: 'B' } | { keyType: 'HASH' };

    /**
     * Definition for sort string.  Used for defining the primary key for Tables and Indexes
     */
    export type SortString = string | { type: 'S' } | { keyType: 'RANGE' } | KeyCondition.StringResolver;

    /**
     * Definition for sort string.  Used for defining the primary key for Tables and Indexes
     */
    export type SortNumber = number | { type: 'N' } | { keyType: 'RANGE' } | KeyCondition.NumberResolver;

    /**
     * Definition for sort string.  Used for defining the primary key for Tables and Indexes
     */
    export type SortBinary = Table.BinaryValue | { type: 'B' } | { keyType: 'RANGE' } | KeyCondition.BinaryResolver;

    // *Map used as key based params in Table
    /**
     * Definition for the {@link Table.keyAttributes}
     */
    export type AttributeTypesMap = { [key: string]: { type: AttributeTypes } };

    /**
     * Definition for the {@link Table.keySchema} and {@link Index.keySchema}
     */
    export type KeyTypesMap = { [key: string]: { keyType: KeyTypes } };

    /**
     * Definition for the key argument used in {@link Table.queryParams}, {@link Table.query},
     * {@link Index.query} and {@link Index.queryParams}
     */
    export type KeyQueryMap = { [key: string]: AttributeValues | KeyCondition.AttributeResolver };

    /**
     * Definition for the key argument used in {@link Table.get}, {@link Table.delete}, {@link Table.put},
     * {@link Table.update} and associated Params methods.
     */
    export type AttributeValuesMap = { [key: string]: AttributeValues };

    // *MapT used as key based params in TableT
    /**
     * Typed based version of {@link Table.PrimaryKey.AttributeTypesMap} used in {@link Table.TableT}
     */
    export type AttributeTypesMapT<T> = {
      [P in keyof Required<T>]: Extract<T[P], { type: AttributeTypes }>;
    };

    /**
     * Typed based version of {@link Table.PrimaryKey.KeyTypesMap} used in {@link Table.TableT} and {@link Index.IndexT}
     */
    export type KeyTypesMapT<T> = {
      [P in keyof Required<T>]: Extract<T[P], { keyType: KeyTypes }>;
    };

    /**
     * Typed based version of {@link Table.PrimaryKey.KeyQueryMap} used in {@link Table.TableT} and {@link Index.IndexT}
     */
    export type KeyQueryMapT<T> = {
      [P in keyof T]: Extract<T[P], Table.AttributeValues | KeyCondition.AttributeResolver>;
    };

    /**
     * Typed based version of {@link Table.PrimaryKey.AttributeValuesMap} used in {@link Table.TableT}
     */
    export type AttributeValuesMapT<T> = {
      [P in keyof Required<T>]: Extract<T[P], Table.AttributeValues>;
    };
  }

  /**
   * Defines what general set of attributes are projected into the secondary index.
   * @typedef _"ALL"_ - All of the attributes of an item are projected into the secondary index.
   * @typedef _"KEYS_ONLY"_ - The table and the secondary index primary keys are projected into the secondary index.
   */
  export type ProjectionType = 'ALL' | 'KEYS_ONLY' | 'INCLUDE';

  // Omit legacy attributes
  //   * @typedef GetInput DocumentClient.GetItemInput
  /**
   * Input params for [DocumentClient.get]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#get-property}
   * Removes legacy parameters from the type definition, including AttributesToGet.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface GetInput extends Omit<DocumentClient.GetItemInput, 'AttributesToGet'> {}

  /**
   * Input params for [DocumentClient.put]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property}
   * Removes legacy parameters from the type definition, including Expected and ConditionalOperator
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface PutInput extends Omit<DocumentClient.PutItemInput, 'Expected' | 'ConditionalOperator'> {}

  /**
   * Input params for [DocumentClient.delete]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#delete-property}
   * Removes legacy parameters from the type definition, including Expected and ConditionalOperator
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface DeleteInput extends Omit<DocumentClient.DeleteItemInput, 'Expected' | 'ConditionalOperator'> {}

  /**
   * Input params for [DocumentClient.update]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#update-property}
   * Removes legacy parameters from the type definition, including AttributeUpdates, Expected and ConditionalOperator
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface UpdateInput
    extends Omit<DocumentClient.UpdateItemInput, 'AttributeUpdates' | 'Expected' | 'ConditionalOperator'> {}

  /**
   * Input params for [DocumentClient.query]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property}
   * Removes legacy parameters from the type definition, including AttributesToGet, KeyConditions, QueryFilter and ConditionalOperator
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface QueryInput
    extends Omit<
      DocumentClient.QueryInput,
      'AttributesToGet' | 'KeyConditions' | 'QueryFilter' | 'ConditionalOperator'
    > {}

  /**
   * Input params for [DocumentClient.scan]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property}
   * Removes legacy parameters from the type definition, including AttributesToGet, QueryFilter and ConditionalOperator
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface ScanInput
    extends Omit<DocumentClient.ScanInput, 'AttributesToGet' | 'ScanFilter' | 'ConditionalOperator'> {}

  /**
   * Base options for all table operations like get, put, delete, update and others.
   */
  export interface BaseOptions<T = {}> {
    /**
     * Expression attributes to use for resolving conditions and updates.  Will be used to generate the
     * ExpressionAttributeNames and ExpressionAttributeValues params in table operations.
     */
    attributes?: ExpressionAttributes;

    /**
     * Array of expression condition resolvers that are joined together with AND, then used as
     * ConditionExpression or FilterExpression params in table operations.
     */
    conditions?: Condition.Resolver[];

    /**
     * Params to pass through to the DocumentClient methods.
     */
    params?: Optional<T>;

    // TODO: Consider passing BaseOptions or something similar to Condition, KeyCondition and Update
    /**
     * User defined context that gets passed through to all Fields.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context?: any;
  }

  /**
   * Options used in following methods:  {@link Table.get}, {@link Table.getParams},
   * {@link Model.get} and {@link Model.getParams}.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface GetOptions extends BaseOptions<GetInput> {}

  /**
   * Options used in following methods:  {@link Table.delete}, {@link Table.deleteParams}, {@link Model.delete}
   * and {@link Model.deleteParams}.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface DeleteOptions extends BaseOptions<DeleteInput> {}

  /**
   * Put method write options that determine how put will execute.
   *
   * - 'Always' - Default put behavior, that will always set the item weather it exists or now.
   * - 'Exists' - Only set the item if the item already exists, adds
   * - ConditionExpression="attribute_exists(#pk)", where #pk is the partition key name.
   * - 'NotExists' - Only set the item if the item does not exist, add
   * ConditionExpression="attribute_not_exists(#pk)", where #pk is the partition key name.
   */
  export type PutWriteOptions = 'Always' | 'Exists' | 'NotExists';

  /**
   * Options to used for put and putParams methods on {@link Table} and {@link Model}, along with
   * {@link Model.new} and {@link Model.replace}.
   */
  export interface PutOptions extends BaseOptions<PutInput> {
    /**
     * Allows put to be conditional based on if the item already exists.
     */
    writeOptions?: PutWriteOptions;
  }

  /**
   * Options used in following methods:  {@link Table.update}, {@link Table.updateParams},
   * {@link Model.update} and {@link Model.updateParams}.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface UpdateOptions extends BaseOptions<UpdateInput> {}

  /**
   * Options used in following methods: {@link Table.query}, {@link Table.queryParams},
   * {@link Index.query} and {@link Index.queryParams}.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface QueryOptions extends BaseOptions<QueryInput> {}

  /**
   * Options used in following methods: {@link Table.scan}, {@link Table.scanParams},
   * {@link Index.scan} and {@link Index.scanParams}.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface ScanOptions extends BaseOptions<ScanInput> {}

  // Default Key definitions
  /**
   * Default and Example table primary key with a generalized compact format.
   */
  export interface DefaultTableKey {
    /**
     * Table partition key.
     */
    P: PrimaryKey.PartitionString;

    /**
     * Table sort key. The sort key is optional to support the sort key as being option for queryParams
     * and query methods.
     */
    S?: PrimaryKey.SortString;
  }

  /**
   * Table constructor param for the generic form of {@link TableParams}.
   * @typeParam KEY interface of the table's primary key.
   * @typeParam ATTRIBUTES The interface or type that has all required attributes, including table
   * and index primary key and all defined index projected attributes.
   */
  export interface TableParamsT<KEY, ATTRIBUTES> extends TableParams {
    /**
     * Generic form of {@link TableParam.keyAttributes}.
     */
    keyAttributes: PrimaryKey.AttributeTypesMapT<ATTRIBUTES>;

    /**
     * Generic form of {@link TableParam.keySchema}.
     */
    keySchema: PrimaryKey.KeyTypesMapT<KEY>;
  }

  /**
   * Generic form of {@link Table}.
   * @typeParam KEY The interface of the table's primary key.
   * @typeParam ATTRIBUTES The interface or type that has all required attributes, including
   * table and index primary key and all defined index projected attributes.
   */
  export interface TableT<KEY = DefaultTableKey, ATTRIBUTES = KEY> extends Table {
    /**
     * Generic form of {@link Table.keyAttributes}.
     */
    keyAttributes: PrimaryKey.AttributeTypesMapT<ATTRIBUTES>;

    /**
     * Generic form of {@link Table.keySchema}.
     */
    keySchema: PrimaryKey.KeyTypesMapT<KEY>;

    /**
     * @see Generic form of {@link Table.getParams}.
     */
    getParams(key: PrimaryKey.AttributeValuesMapT<KEY>, options?: Table.GetOptions): Table.GetInput;

    /**
     * @see Generic form of {@link Table.deleteParams}.
     */
    deleteParams(
      key: PrimaryKey.AttributeValuesMapT<KEY>,
      options?: Table.DeleteOptions,
    ): DocumentClient.DeleteItemInput;

    /**
     * @see Generic form of {@link Table.putParams}.
     */
    putParams(
      key: PrimaryKey.AttributeValuesMapT<KEY>,
      item?: Table.AttributeValuesMap,
      options?: Table.PutOptions,
    ): DocumentClient.PutItemInput;

    /**
     * @see Generic form of {@link Table.updateParams}.
     */
    updateParams(
      key: PrimaryKey.AttributeValuesMapT<KEY>,
      item?: Update.UpdateMapValue,
      options?: Table.UpdateOptions,
    ): DocumentClient.UpdateItemInput;

    /**
     * @see Generic form of {@link Table.queryParams}.
     */
    queryParams(key: PrimaryKey.KeyQueryMapT<KEY>, options?: Table.QueryOptions): DocumentClient.QueryInput;

    /**
     * @see Generic form of {@link Table.scanParams}.
     */
    scanParams(options?: Table.ScanOptions): DocumentClient.ScanInput;

    // actions:
    /**
     * @see Generic form of {@link Table.get}.
     */
    get(key: PrimaryKey.AttributeValuesMapT<KEY>, options?: Table.GetOptions): Promise<DocumentClient.GetItemOutput>;

    /**
     * @see Generic form of {@link Table.delete}.
     */
    delete(
      key: PrimaryKey.AttributeValuesMapT<KEY>,
      options?: Table.DeleteOptions,
    ): Promise<DocumentClient.DeleteItemOutput>;

    /**
     * @see Generic form of {@link Table.put}.
     */
    put(
      key: PrimaryKey.AttributeValuesMapT<KEY>,
      item?: Table.AttributeValuesMap,
      options?: Table.PutOptions,
    ): Promise<DocumentClient.PutItemOutput>;

    /**
     * @see Generic form of {@link Table.update}.
     */
    update(
      key: PrimaryKey.AttributeValuesMapT<KEY>,
      item?: Update.UpdateMapValue,
      options?: UpdateOptions,
    ): Promise<DocumentClient.UpdateItemOutput>;

    /**
     * @see Generic form of {@link Table.query}.
     */
    query(key: PrimaryKey.KeyQueryMapT<KEY>, options?: Table.QueryOptions): Promise<DocumentClient.QueryOutput>;

    /**
     * @see Generic form of {@link Table.scan}.
     */
    scan(options?: ScanOptions): Promise<DocumentClient.ScanOutput>;
  }

  /**
   * Creates the generic form of {@link Table} used in TypeScript to get strong typing.
   *
   *
   * So you may ask, why have createTable over just using new {@link TableT}?  The reason is that since the method
   * signature is exactly the same (same method names with same params, only typings are more strict) between
   * TableT and Table there is no need to have TableT class with just a bunch of pass through wrapper methods.
   * This also makes the {@link Table} TSDocs easier to read without all of the TypeScript Generic types.  Same
   * approach is taken with {@link Index} and {@link Model}.
   * @typeParam KEY The interface of the table's primary key.
   * @typeParam ATTRIBUTES The interface or type that has all required attributes, including table and index
   * primary key and all defined index projected attributes.
   * @param params Table constructor params.
   * @returns A new table as TableT.
   */
  // eslint-disable-next-line no-inner-declarations
  export function createTable<KEY = Table.DefaultTableKey, ATTRIBUTES = KEY>(
    params: TableParamsT<KEY, ATTRIBUTES>,
  ): TableT<KEY, ATTRIBUTES> {
    return new Table(params) as TableT<KEY, ATTRIBUTES>;
  }
}
