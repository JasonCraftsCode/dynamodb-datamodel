import { ExpressionAttributeNameMap } from 'aws-sdk/clients/dynamodb';
import { Update, UpdateExpression } from '../src/Update';
import { Table } from '../src/Table';

// t = milliseconds
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function delay(tms: number, v: any): Promise<unknown> {
  return new Promise((resolve) => {
    setTimeout(resolve.bind(null, v), tms);
  });
}
/*
export function delayCallback(tms: number, f: () => void) {
  return new Promise((resolve, reject) => {
    f();
  });
}
*/

export function buildUpdate(
  updateMap: Update.ResolverMap,
  exp = new UpdateExpression(),
): {
  UpdateExpression: string | undefined;
  Paths: ExpressionAttributeNameMap;
  Values: Table.AttributeValuesMap;
} {
  const update = Update.buildExpression(updateMap, exp);
  return {
    UpdateExpression: update,
    Paths: exp.attributes.getPaths(),
    Values: exp.attributes.getValues(),
  };
}
