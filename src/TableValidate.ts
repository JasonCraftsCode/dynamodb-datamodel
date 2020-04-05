import { onError } from './Common';
import { Table } from './Table';

// Validate:
// - Table initialize
// - Index initialize
// - params & action args (key and params)

// move all validation in to separate npm package
export interface KeyName {
  pk?: string;
  sk?: string;
}

export function validateKeySchema<
  KEY extends { [index: string]: any },
  ATTRIBUTES extends { [index: string]: any } = KEY
>(
  keySchema: Table.PrimaryKeySchemaT<KEY>,
  keyAttributes: Table.PrimaryAttributeDefinitionsT<ATTRIBUTES>,
  name: string,
): KeyName {
  let { pk, sk }: KeyName = {};
  Object.keys(keySchema).forEach((key) => {
    const schema = keySchema[key];
    if (keyAttributes[key] === undefined) onError(`Key '${key}' not in keyAttributes`);
    if (schema.keyType === Table.PrimaryKeyType.Hash) {
      if (pk !== undefined) onError(`Key '${key}' invalid, ${name} already has partition key '${pk}'`);
      pk = key;
    }
    if (schema.keyType === Table.PrimaryKeyType.Range) {
      if (sk !== undefined) onError(`Key '${key}' invalid, ${name} already has sort key '${sk}'`);
      sk = key;
    }
  });
  if (pk === undefined) onError(`${name} needs partition key`);
  return { pk, sk };
}

export function validateTable<KEY, ATTRIBUTES>(table: Table<KEY, ATTRIBUTES>) {
  const { pk, sk } = validateKeySchema(table.keySchema, table.keyAttributes, table.name);
  const names = new Set<string>();
  table.globalIndexes?.forEach(({ name, keySchema }) => {
    if (names.has(name)) onError(`Duplicate index name '${name}`);
    names.add(name);
    const ikeys = validateKeySchema(keySchema, table.keyAttributes, name);
    if (ikeys.pk === pk && ikeys.sk === sk) onError(`${name} has same primary key '${ikeys}' as table`);
  });
  table.localIndexes?.forEach(({ name, keySchema }) => {
    if (names.has(name)) onError(`Duplicate index name '${name}`);
    names.add(name);
    const ikeys = validateKeySchema(keySchema, table.keyAttributes, name);
    if (ikeys.pk !== pk) onError(`${name} partition key '${ikeys.pk}' needs to be '${pk}'`);
    if (ikeys.sk === sk) onError(`${name} has same sort key '${sk}' as table`);
  });
}
