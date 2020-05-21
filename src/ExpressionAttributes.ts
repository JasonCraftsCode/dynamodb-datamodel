import { ExpressionAttributeNameMap } from 'aws-sdk/clients/dynamodb';
import { Table } from './Table';

/**
 * Object used in Condition, KeyCondition and Update resolver methods to create attribute names and values
 * aliases and store the mappings for use in ExpressionAttributeNames and ExpressionAttributeValues params.
 * @public
 */
export class ExpressionAttributes implements Table.ExpressionAttributes {
  /**
   * RegEx that validates an attribute name would not need to use an alias.
   */
  static validAttributeNameRegEx = /^[A-Za-z][A-Za-z0-9]*$/;

  /**
   * Validates that an attribute name can be used without an alias.
   * @param name - Name of an attribute.
   * @returns true if the attribute name is valid.
   */
  static isValidAttributeName(name: string): boolean {
    return ExpressionAttributes.validAttributeNameRegEx.test(name);
  }

  /**
   * Property function to determine if the name is a reserved word and should use an alias.
   * For a current list of reserved words see DynamoDB-ReservedWords module in NPM.
   * The reason to set isReservedName and isValidName is to allow the attribute names to be directly
   * embedded into the expression string, which can make them easier to read.
   * @defaultValue '() =\> false;' - To use aliases for all attribute names.
   */
  isReservedName: (name: string) => boolean = () => false;

  /**
   * Property function to determine if the name is valid to use without an alias.
   * Can use ExpressionAttribute.isValidAttributeName.
   * WARNING: Must be used with a proper isReservedName function to ensure reserved words are not used
   * without an alias otherwise the operations will return an error.
   * @defaultValue '() =\> false;' - To use aliases for all attribute names.
   */
  isValidName: (name: string) => boolean = () => false;

  /**
   * Parse all names into paths by using the pathDelimiter, to make working with nested attributes easy.
   * @defaultValue true - Since most all names won't contain pathDelimiter then just do this by default.
   */
  treatNameAsPath = true;

  /**
   * Delimiter to use for paths.
   * @defaultValue '.' - Period is used in javascript for nested objects.
   */
  pathDelimiter = '.';

  /**
   * Attribute names mapping, used to populate the ExpressionAttributeNames param.
   */
  names: ExpressionAttributeNameMap = {};

  /**
   * Auto incrementing name id used in names mapping.
   * @defaultValue 0
   */
  nextName = 0;

  /**
   * Attribute values mapping, used to populate the ExpressionAttributeValues param.
   */
  values: Table.AttributeValuesMap = {};

  /**
   * Auto incrementing value id used in values mapping.
   * @defaultValue 0
   */
  nextValue = 0;

  /**
   * Parse an attribute path and adds the names to the names mapping as needed and hands back an alias to use
   * in an expression.  If the name already exists in the map the existing alias will be used.
   * When this.treatNameAsPath is true the name argument will be parsed as a path and will handle arrays
   * embedded in the path correctly, to allow access to all deep attribute.
   * @param name - Attribute path that can be delimited by a pathDelimiter and contain array notations '[]'.
   * @returns Alias path to use for the attribute name or the name if not aliasing is needed, delimited by '.'.
   */
  addPath(name: string): string {
    if (this.treatNameAsPath) {
      const pathList = name.split(this.pathDelimiter).reduce((prev, curr) => {
        if (curr.endsWith(']')) {
          const beginBracket = curr.indexOf('[');
          const listName = this.addName(curr.substring(0, beginBracket));
          prev.push(`${listName}${curr.substring(beginBracket)}`);
        } else prev.push(this.addName(curr));

        return prev;
      }, new Array<string>());
      return pathList.join('.');
    }
    return this.addName(name);
  }

  /**
   * Adds the value to the values map and hands back an alias to use in ab expression.
   * A new alias will always be created every time addValue is called.
   * @param value - Value to add to the values map.
   * @returns Alias to use in place of the value.
   */
  addValue(value: Table.AttributeValues): string {
    const name = `:v${this.nextValue++}`;
    this.values[name] = value;
    return name;
  }

  /**
   * Gets the names map to assign to ExpressionAttributeNames.
   */
  getPaths(): ExpressionAttributeNameMap | void {
    if (Object.keys(this.names).length > 0) return this.names;
  }

  /**
   * Gets the values map to assign to ExpressionAttributeValues.
   */
  getValues(): Table.AttributeValuesMap | void {
    if (Object.keys(this.values).length > 0) return this.values;
  }

  /**
   * Resets the names and values map to use for a new expression.
   */
  reset(): void {
    this.names = {};
    this.nextName = 0;
    this.values = {};
    this.nextValue = 0;
  }

  /**
   * Helper method to set ExpressionAttributeNames and ExpressionAttributeValues values on the input argument.
   * @param params - Input params used for DocumentClient put, delete, update, query and scan methods.
   * @returns The input params argument passed in.
   */
  static addParams(
    attributes: Table.ExpressionAttributes,
    params: {
      ExpressionAttributeNames?: ExpressionAttributeNameMap;
      ExpressionAttributeValues?: Table.AttributeValuesMap;
    },
  ): {
    ExpressionAttributeNames?: ExpressionAttributeNameMap;
    ExpressionAttributeValues?: Table.AttributeValuesMap;
  } {
    const paths = attributes.getPaths();
    if (paths) params.ExpressionAttributeNames = paths;
    else delete params.ExpressionAttributeNames;

    const values = attributes.getValues();
    if (values) params.ExpressionAttributeValues = values;
    else delete params.ExpressionAttributeValues;

    return params;
  }

  /**
   * Private method to add an attribute name to the names mapping if needed and hand back an alias to use in
   * an expression.
   * @param name - Attribute name.
   * @returns Alias to use for the attribute name or the name if not aliasing is needed.
   */
  private addName(name: string): string {
    const names = this.names;
    if (this.isReservedName(name)) {
      const attName = `#${name}`;
      names[attName] = name;
      return attName;
    } else if (!this.isValidName(name)) {
      for (const key in names) if (names[key] === name) return key;
      const attName = `#n${this.nextName++}`;
      names[attName] = name;
      return attName;
    }
    return name;
  }
}
