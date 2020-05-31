/**
 * Table.ts contains the classes used to model a DynamoDB local and global secondary indexes.
 * @packageDocumentation
 */
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Table } from './Table';

/**
 * Represents either Global Secondary Index (GSI) or Local Secondary Index (LSI) for a table.  GSI and LSI can be
 * associated with a {@link Table} by add GSI to the {@link Table.globalIndexes} array property and LSI to the {@link Table.localIndexes}
 * array property, either through the {@link Table."constructor"} or by calling {@link Table.addGlobalIndexes} or {@link Table.addLocalIndexes}.
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
 * @example [examples/Index.ts]{@link https://github.com/JasonCraftsCode/dynamodb-datamodel/blob/master/examples/Index.ts}
 * ```typescript
 * [[include:Index.ts]]
 * ```
 *
 * See {@link Table} for how to include Indexes into a Table.
 * @public
 */
export class Index {
  // NOTE: If you update the below property docs also update IndexParams.
  /**
   * Name of the table's secondary index, used to set the IndexName for dynamodb scan and query actions.
   */
  name: string;
  /**
   * Schema map for the Secondary Index's primary key, in the form of \{ \<partition key name\>: \{ keyType: 'HASH' \} \}.
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
   * @param params - Initialize the Index's name, keySchema and projection properties.
   */
  constructor(params: Index.IndexParams) {
    this.name = params.name;
    this.keySchema = params.keySchema;
    this.projection = params.projection;
  }

  /**
   * Used to initialize the Index with the table to support {@link queryParams}, {@link scanParams}, {@link query}, and {@link scan}.
   * @param table - Table to initialize the index with.
   */
  init(table: Table): void {
    this.table = table;
  }

  /**
   * Gets the partition key name for the Index.
   * @returns The name of the primary (or HASH) key.
   */
  getPartitionKey(): string {
    return Table.getKeyName(this.keySchema, 'HASH');
  }

  /**
   * Gets the sort key name for the Index.
   * @returns The name of the sort (or RANGE) key, or an empty string if one doesn't exists.
   */
  getSortKey(): string {
    return Table.getKeyName(this.keySchema, 'RANGE');
  }

  /**
   * Add the IndexName to query options.
   * @param options - Options to add IndexName to.
   * @returns Query options with the IndexName set to the {@link Index.name}.
   */
  getQueryOptions(options: Table.QueryOptions = {}): Table.QueryOptions {
    return { ...options, params: { IndexName: this.name, ...options.params } };
  }

  /**
   * Add the IndexName to scan options.
   * @param options - Options to add IndexName to.
   * @returns Scan options with the IndexName set to the {@link Index.name}.
   */
  getScanOptions(options: Table.ScanOptions = {}): Table.ScanOptions {
    return { ...options, params: { IndexName: this.name, ...options.params } };
  }

  /**
   * Creates the params that can be used when calling the [DocumentClient.query]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property} method.
   * @param key - Primary key with optional KeyCondition to query the secondary index with.
   * @param options - Used in building the query params.
   * @returns DynamoDB query method params containing the table, index, key and options.
   */
  queryParams(key: Table.PrimaryKey.KeyQueryMap, options?: Table.QueryOptions): DocumentClient.QueryInput {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.table!.queryParams(key, this.getQueryOptions(options));
  }

  /**
   * Creates the params that can be used when calling the [DocumentClient.scan]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property} method.
   * @param options - Used in building the scan params.
   * @returns DocumentClient scan method's params containing the table, index and options.
   */
  scanParams(options?: Table.ScanOptions): DocumentClient.ScanInput {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.table!.scanParams(this.getScanOptions(options));
  }

  /**
   * Wrapper around [DocumentClient.query]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property}
   * method that uses the index and table properties with the key and options params.
   * @param key - Primary key with optional KeyCondition to query the secondary index with.
   * @param options - Used in building the query params.
   * @returns Promise with the query results, including items fetched.
   */
  query(key: Table.PrimaryKey.KeyQueryMap, options?: Table.QueryOptions): Promise<DocumentClient.QueryOutput> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.table!.query(key, this.getQueryOptions(options));
  }
  /**
   * Wrapper around [DocumentClient.scan]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property}
   * method that uses the index and table properties with the options param.
   * @param options - Used in building the scan params.
   * @returns Promise with the scan results, including items fetched.
   */
  scan(options?: Table.ScanOptions): Promise<DocumentClient.ScanOutput> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.table!.scan(this.getScanOptions(options));
  }
}

/**
 * Is also a namespace for scoping Index based interfaces and types.
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-namespace, no-redeclare
export namespace Index /* istanbul ignore next: needed for ts with es5 */ {
  // NOTE: if you update the docs for the properties of IndexParams also update the docs for Index properties.
  /**
   * Used in {@link Index."constructor"}.
   */
  export interface IndexParams {
    /**
     * Name of the table's secondary index, used to set the IndexName for dynamodb scan and query actions.
     */
    name: string;

    /**
     * Schema map for the Secondary Index's primary key, in the form of \{ \<partition key name\>: \{ keyType: 'HASH' \} \}.
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
   * @param KEY - The interface of the index's primary key.
   */
  export interface IndexParamsT<KEY> extends IndexParams {
    /**
     * Generic form of {@link IndexParam.keySchema}.
     */
    keySchema: Table.PrimaryKey.KeyTypesMapT<KEY>;
  }

  /**
   * Generic form of {@link Index}.
   * @param KEY - The interface of the index's primary key.
   */
  export interface IndexT<KEY = DefaultGlobalIndexKey> extends Index {
    /**
     * Generic form of {@link Index.keySchema}.
     */
    keySchema: Table.PrimaryKey.KeyTypesMapT<KEY>;

    /**
     * See Generic form of {@link Index.queryParams}.
     */
    queryParams(key: Table.PrimaryKey.KeyQueryMapT<KEY>, options?: Table.QueryOptions): DocumentClient.QueryInput;

    /**
     * Generic form of {@link Index.query}.
     */
    query(key: Table.PrimaryKey.KeyQueryMapT<KEY>, options?: Table.QueryOptions): Promise<DocumentClient.QueryOutput>;
  }

  /**
   * Creates the generic form of Index used in TypeScript to get strong typing.
   *
   * See {@link Table.createTable} reasoning for having a createTable over support 'new TableT'.
   * @param params - Index constructor params.
   */
  // eslint-disable-next-line no-inner-declarations
  export function createIndex<KEY = DefaultGlobalIndexKey>(params: IndexParamsT<KEY>): IndexT<KEY> {
    return new Index(params) as IndexT<KEY>;
  }
}
