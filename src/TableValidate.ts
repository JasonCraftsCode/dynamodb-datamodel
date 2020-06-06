/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { Table } from './Table';
import { Index } from './TableIndex';

/**
 * Attribute names of the primary key for tables and indexes.
 */
export interface KeyName {
  /**
   * Partition key name.
   */
  pk?: string;

  /**
   * Sort key name.
   */
  sk?: string;
}

/**
 * Validate the key attributes for a {@link Table}.
 * @param ATTRIBUTES - The interface or type that has all required attributes, including table and index
 * primary key and all defined index projected attributes.
 * @param keyAttributes - Key attributes of the Table.
 * @param name - Name of Table.
 * @param onError - Method to call when there is a validation error.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateKeyAttributes<ATTRIBUTES extends { [index: string]: any }>(
  keyAttributes: Table.PrimaryKey.AttributeTypesMapT<ATTRIBUTES>,
  name: string,
  onError: (msg: string) => void,
): void {
  Object.keys(keyAttributes).forEach((key) => {
    const attr = keyAttributes[key] as { type: Table.PrimaryKey.AttributeTypes };
    if (attr.type !== 'S' && attr.type !== 'N' && attr.type !== 'B')
      onError(`Primary key '${key}' has an invalid type of '${attr.type as string}' in table '${name}'`);
  });
}

/**
 * Validate the key schema for a {@link Table}.
 * @param KEY - The interface of the table's primary key
 * @param ATTRIBUTES - The interface or type that has all required attributes, including table and index
 * primary key and all defined index projected attributes.
 * @param keySchema - Key schema of the Table.
 * @param keyAttributes - Key attributes of the Table.
 * @param name - Name of the Table.
 * @param onError - Method to call when there is a validation error.
 */
export function validateKeySchema<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  KEY extends { [index: string]: any },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ATTRIBUTES extends { [index: string]: any } = KEY
>(
  keySchema: Table.PrimaryKey.KeyTypesMapT<KEY>,
  keyAttributes: Table.PrimaryKey.AttributeTypesMapT<ATTRIBUTES>,
  name: string,
  onError: (msg: string) => void,
): KeyName {
  let { pk, sk }: KeyName = {};
  Object.keys(keySchema).forEach((key) => {
    const schema = keySchema[key] as { keyType: Table.PrimaryKey.KeyTypes };
    const attr = keyAttributes[key] as { type: Table.PrimaryKey.AttributeTypes };
    if (attr === undefined) onError(`Key '${key}' not in table's keyAttributes`);

    if (schema.keyType === 'HASH') {
      if (pk !== undefined) onError(`Key '${key}' invalid, ${name} already has partition key '${pk}'`);
      pk = key;
    } else if (schema.keyType === 'RANGE') {
      if (sk !== undefined) onError(`Key '${key}' invalid, ${name} already has sort key '${sk}'`);
      sk = key;
    } else onError(`Key '${key}' has an invalid key type of '${schema.keyType as string}'`);
  });
  if (pk === undefined) onError(`${name} needs partition key`);
  return { pk, sk };
}

/**
 * Validates an {@link Index} for a {@link Table}.
 * @param index - An index for a Table.
 * @param names - Name of the other indexes.
 * @public
 */
export function validateIndex(index: Index, names?: Set<string>): void {
  const { name, keySchema, projection, table, type } = index;
  const { keyAttributes, onError } = table;

  // Validate index name
  if (!name) onError(`Global index must have a name`);
  if (names) {
    if (names.has(name)) onError(`Duplicate index name '${name}'`);
    names.add(name);
  }

  // Validate index projection
  const projType = projection.type;
  if (projType === 'INCLUDE') {
    if (!projection.attributes || projection.attributes.length <= 0)
      onError(`'${name}' projection type '${projType}' must have attributes`);
  } else if (projType !== 'ALL' && projType !== 'KEYS_ONLY')
    onError(`'${name}' projection type is invalidate '${projType as string}'`);
  else if (projection.attributes) onError(`${name}' projection type '${projType}' does not support attributes`);

  // Validate index keySchema
  const tableKey = { pk: table.getPartitionKey(), sk: table.getSortKey() };
  const indexKey = validateKeySchema(keySchema, keyAttributes, name, onError);
  if (type === 'GLOBAL') {
    if (indexKey.pk === tableKey.pk && indexKey.sk === tableKey.sk)
      onError(`${name} has same partition key '${indexKey.pk}' and sort key '${indexKey.sk}' as table`);
  } else if (type === 'LOCAL') {
    if (indexKey.pk !== tableKey.pk) onError(`${name} partition key '${indexKey.pk}' needs to be '${tableKey.pk}'`);
    if (indexKey.sk === tableKey.sk) onError(`${name} has same sort key '${tableKey.sk}' as table`);
    if (indexKey.sk === undefined) onError(`${name} must have a sort key`);
  } else onError(`${name} has invalid type: ${type}`);
}

/**
 * Validates an array of {@link Index} for a {@link Table}.
 * @param indexes - Indexes for a Table.
 * @public
 */
export function validateIndexes(indexes: Index[]): void {
  const names = new Set<string>();
  indexes.forEach((index) => validateIndex(index, names));
}

/**
 * Validates that a {@link Table} is configured correctly.  The Table's onError methods is called for any
 * validation errors.   This method should primarily be used in tests to validate the table.
 * @param KEY - The interface of the table's primary key.
 * @param ATTRIBUTES - The interface or type that has all required attributes, including table and index primary
 * key and all defined index projected attributes.
 * @param table - Table to be validated.
 * @public
 */
export function validateTable<KEY, ATTRIBUTES>(table: Table.TableT<KEY, ATTRIBUTES>): void {
  const { name, keyAttributes, keySchema, onError } = table;
  if (!name) onError(`Table must have a name`);
  validateKeyAttributes(keyAttributes, name, onError);
  validateKeySchema(keySchema, keyAttributes, name, onError);
}
