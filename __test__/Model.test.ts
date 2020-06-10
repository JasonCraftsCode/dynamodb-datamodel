/* eslint-disable @typescript-eslint/unbound-method */
import { AWSError, Request } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

import { Condition } from '../src/Condition';
import { Fields } from '../src/Fields';
import { Model } from '../src/Model';
import { Table } from '../src/Table';
// import { Index } from '../src/TableIndex';
import { Update } from '../src/Update';
import { delay } from './testCommon';

const client = new DocumentClient({ convertEmptyValues: true });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const request = (out: any): Request<DocumentClient.GetItemOutput, AWSError> => {
  return {
    promise() {
      return delay(1, out);
    },
  } as Request<DocumentClient.GetItemOutput, AWSError>;
};

it('Validate Model exports', () => {
  expect(typeof Model).toBe('function');
});

interface TableKey {
  P: Table.PrimaryKey.PartitionString;
  S?: Table.PrimaryKey.SortString;
}

interface GSI0Key {
  G0P: Table.PrimaryKey.PartitionString;
  G0S?: Table.PrimaryKey.SortString;
}

interface LSI0Key {
  P: Table.PrimaryKey.PartitionString;
  L0S?: Table.PrimaryKey.SortNumber;
}

interface TableAttributes extends TableKey, GSI0Key, LSI0Key {}

const table = Table.createTable<TableKey, TableAttributes>({
  name: 'MainTable',
  keyAttributes: {
    P: Table.PrimaryKey.StringType,
    S: Table.PrimaryKey.StringType,
    G0P: Table.PrimaryKey.StringType,
    G0S: Table.PrimaryKey.StringType,
    L0S: Table.PrimaryKey.NumberType,
  },
  keySchema: {
    P: Table.PrimaryKey.PartitionKeyType,
    S: Table.PrimaryKey.SortKeyType,
  },
  client,
});

/*
const gsi0 = Index.createIndex<GSI0Key>({
  name: 'GSI0',
  keySchema: {
    G0P: Table.PrimaryKey.PartitionKeyType,
    G0S: Table.PrimaryKey.SortKeyType,
  },
  projection: { type: 'ALL' },
  table: table as Table,
  type: 'GLOBAL',
});

const lsi0 = Index.createIndex<LSI0Key>({
  name: 'LSI0',
  keySchema: {
    P: Table.PrimaryKey.PartitionKeyType,
    L0S: Table.PrimaryKey.SortKeyType,
  },
  projection: { type: 'ALL' },
  table: table as Table,
  type: 'LOCAL',
});
*/

const location = Fields.compositeNamed({
  alias: 'G0S',
  map: {
    city: 0,
    state: 1,
    country: 2,
  },
});
const locationSlots = location.createNamedSlots();

interface ChildModel {
  name: string;
  age: number;
  adult: boolean;
}

const childSchema = {
  name: Fields.string(),
  age: Fields.number(),
  adult: Fields.boolean(),
};

interface SpouseModel {
  name: Update.String; //string;
  age: Update.Number;
  married: Update.Boolean;
}

const spouseSchema = {
  name: Fields.string(),
  age: Fields.number(),
  married: Fields.boolean(),
};

enum Role {
  Guest = 0,
  Member = 1,
  Leader = 2,
  Admin = 3,
}

interface GroupModel {
  role: Role;
}

const groupSchema = {
  role: Fields.number(),
};

interface UserKey {
  id: string;
}

interface SpouseModelOutput {
  name: string; //string;
  age: number;
  married: boolean;
}

interface ChildModelOutput {
  name: string;
  age: number;
  adult: boolean;
}

interface GroupModelOutput {
  role: Role;
}

interface ApiUserModel {
  id: string;
  type?: string;
  city?: string;
  state?: string;
  country?: string;
  name: string;
  count?: number;
  description?: string;
  revision: number;
  adult: boolean;
  photo?: Table.BinaryValue;
  interests?: Table.StringSetValue;
  modified?: Table.NumberSetValue;
  spouse?: SpouseModelOutput;
  children?: ChildModelOutput[];
  groups?: { [key: string]: GroupModelOutput };
  created: number;
  updated: number;
  hide?: Set<Date>;
  nickname?: string;
}

interface UserInputModel extends UserKey {
  city?: string;
  state?: string;
  country?: string;
  name: Update.String;
  count?: Update.Number;
  description?: Update.String;
  adult: Update.Boolean;
  photo?: Update.Binary;
  interests?: Update.StringSet;
  modified?: Update.NumberSet;
  spouse?: Update.Model<SpouseModel>;
  children?: Update.List<ChildModel>;
  groups?: Update.Map<GroupModel>;
  hide?: Set<Date>;
  nickname?: Update.String;
}

interface UserOutputModel extends UserKey, UserInputModel {
  type?: string;
  revision: Update.Number;
  created: Update.Number;
  updated: Update.Number;
}

const userSchema = {
  id: Fields.split({ aliases: [table.getPartitionKey(), table.getSortKey()] }),
  type: Fields.type({ alias: 'T' }),
  city: locationSlots.city,
  state: locationSlots.state,
  country: locationSlots.country,
  name: Fields.string(),
  count: Fields.number(),
  description: Fields.string({ alias: 'desc' }),
  revision: Fields.revision({ alias: 'rev', start: 1 }),
  adult: Fields.boolean(),
  photo: Fields.binary(),
  interests: Fields.stringSet(),
  modified: Fields.numberSet(),
  children: Fields.modelList<ChildModel>({ schema: childSchema }),
  spouse: Fields.model<SpouseModel>({ schema: spouseSchema }),
  groups: Fields.modelMap<GroupModel>({ schema: groupSchema }),
  created: Fields.createdNumberDate({ now: () => new Date(1585563302000) }),
  updated: Fields.updatedNumberDate({ now: () => new Date(1585563303000), toModelDefaultAlias: 'created' }),
  hide: Fields.hidden(),
  nickname: Fields.string({ default: 'none' }),
};

const userModel = Model.createModel<UserKey, UserInputModel, UserOutputModel>({
  schema: userSchema,
  table: table as Table,
});

describe('Validate Model with Table and Indexes', () => {
  it('Model.getContext with empty options to return with conditions', () => {
    const context = userModel.getContext('put', {});
    expect(context).toEqual({ action: 'put', conditions: [], model: userModel, options: { conditions: [] } });
  });

  it('Model.getContext with exiting options.conditions', () => {
    const options: Table.BaseOptions = { conditions: [Condition.eq('path', 'value')] };
    const context = userModel.getContext('put', options);
    expect(context).toEqual({ action: 'put', conditions: options.conditions, model: userModel, options });
  });

  describe('model params', () => {
    it('Model.getParams with single id', () => {
      const params = userModel.getParams({ id: 'id1' });
      expect(params).toEqual({
        Key: { P: 'id1' },
        TableName: 'MainTable',
      });
    });

    it('Model.getParams with multiple id', () => {
      const params = userModel.getParams({ id: 'id1.id2.id3.id4' });
      expect(params).toEqual({
        Key: { P: 'id1.id2.id3', S: 'id4' },
        TableName: 'MainTable',
      });
    });

    it('Model.getParams with two id', () => {
      const params = userModel.getParams({ id: 'id1.id2' });
      expect(params).toEqual({
        Key: { P: 'id1', S: 'id2' },
        TableName: 'MainTable',
      });
    });

    it('Model.deleteParams', () => {
      const params = userModel.deleteParams({ id: 'id1.id2' });
      expect(params).toEqual({
        Key: { P: 'id1', S: 'id2' },
        TableName: 'MainTable',
      });
    });

    it('Model.putParams with min fields', () => {
      const params = userModel.putParams({
        id: 'id1.id2',
        name: 'name1',
        adult: true,
      });
      expect(params).toEqual({
        Item: {
          P: 'id1',
          S: 'id2',
          name: 'name1',
          rev: 1,
          adult: true,
          nickname: 'none',
          created: 1585563302,
        },
        TableName: 'MainTable',
      });
    });

    it('Model.putParams with all fields', () => {
      const params = userModel.putParams({
        id: 'id1.id2',
        name: 'name1',
        adult: true,
        city: 'new york',
        state: 'new york',
        country: 'usa',
        description: 'user description',
        count: 2,
        photo: Buffer.from('Photo Buffer'),
        spouse: { age: 40, married: true, name: 'spouse' },
        children: [
          {
            name: 'child1',
            age: 7,
            adult: false,
          },
          {
            name: 'child2',
            age: 10,
            adult: false,
          },
        ],
        modified: table.createNumberSet([1585553302, 1585563302]),
        interests: table.createStringSet(['basketball', 'soccer', 'football']),
        groups: { group1: { role: Role.Guest }, group3: { role: Role.Member } },
        hide: new Set([new Date(), new Date()]),
      });
      expect(params).toEqual({
        Item: {
          G0S: 'new york;new york;usa',
          P: 'id1',
          S: 'id2',
          adult: true,
          children: [
            {
              name: 'child1',
              age: 7,
              adult: false,
            },
            {
              name: 'child2',
              age: 10,
              adult: false,
            },
          ],
          count: 2,
          created: 1585563302,
          desc: 'user description',
          groups: {
            group1: {
              role: 0,
            },
            group3: {
              role: 1,
            },
          },
          interests: table.createStringSet(['basketball', 'soccer', 'football']),
          modified: table.createNumberSet([1585553302, 1585563302]),
          name: 'name1',
          nickname: 'none',
          photo: Buffer.from('Photo Buffer'),
          rev: 1,
          spouse: {
            age: 40,
            married: true,
            name: 'spouse',
          },
        },
        TableName: 'MainTable',
      });
    });

    it('Model.updateParams min args', () => {
      const params = userModel.updateParams({ id: 'id1.id2' });
      expect(params).toEqual({
        ExpressionAttributeNames: { '#n0': 'rev', '#n1': 'updated' },
        ExpressionAttributeValues: { ':v0': 1, ':v1': 1585563303 },
        Key: { P: 'id1', S: 'id2' },
        ReturnValues: 'ALL_NEW',
        TableName: 'MainTable',
        UpdateExpression: 'SET #n0 = #n0 + :v0, #n1 = :v1',
      });
    });

    it('Model.updateParams with all fields', () => {
      const params = userModel.updateParams({
        id: 'id1.id2',
        name: Update.set('new name'),
        city: 'kirkland',
        state: 'wa',
        country: 'usa',
        description: null,
        adult: Update.del(),
        count: Update.add('revision', 3),
        spouse: Update.model<SpouseModel>({
          age: Update.dec(1),
          married: Update.del(),
          name: 'new spouse',
        }),
        children: Update.prepend([{ name: 'child3', age: 3, adult: false }]),
        photo: Update.path('photo'),
        modified: Update.addToSet(table.createNumberSet([1585533302, 1585543302])),
        interests: Update.removeFromSet(table.createStringSet(['soccer', 'football'])),
        groups: Update.map({
          group1: Update.del(),
          'group3.role': Role.Leader,
          group4: { role: Role.Admin },
        }),
      });
      expect(params).toEqual({
        ExpressionAttributeNames: {
          '#n0': 'G0S',
          '#n1': 'name',
          '#n10': 'children',
          '#n11': 'spouse',
          '#n12': 'age',
          '#n13': 'married',
          '#n14': 'groups',
          '#n15': 'group1',
          '#n16': 'group3',
          '#n17': 'role',
          '#n18': 'group4',
          '#n19': 'updated',
          '#n2': 'count',
          '#n3': 'revision',
          '#n4': 'desc',
          '#n5': 'rev',
          '#n6': 'adult',
          '#n7': 'photo',
          '#n8': 'interests',
          '#n9': 'modified',
        },
        ExpressionAttributeValues: {
          ':v0': 'kirkland;wa;usa',
          ':v1': 'new name',
          ':v10': { role: 3 },
          ':v11': 1585563303,
          ':v2': 3,
          ':v3': 1,
          ':v4': table.createStringSet(['soccer', 'football']),
          ':v5': table.createNumberSet([1585533302, 1585543302]),
          ':v6': [{ adult: false, age: 3, name: 'child3' }],
          ':v7': 1,
          ':v8': 'new spouse',
          ':v9': 2,
        },
        Key: { P: 'id1', S: 'id2' },
        ReturnValues: 'ALL_NEW',
        TableName: 'MainTable',
        UpdateExpression:
          'SET #n0 = :v0, #n1 = :v1, #n2 = #n3 + :v2, #n5 = #n5 + :v3, #n7 = #n7, #n10 = list_append(:v6, #n10), #n11.#n12 = #n11.#n12 - :v7, #n11.#n1 = :v8, #n14.#n16.#n17 = :v9, #n14.#n18 = :v10, #n19 = :v11 REMOVE #n4, #n6, #n11.#n13, #n14.#n15 ADD #n9 :v5 DELETE #n8 :v4',
      });
    });
  });

  describe('model actions', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('Model.get with single id', async () => {
      client.get = jest.fn(() => request({ Item: { P: 'id1' } }));
      const results = await userModel.get({ id: 'id1' });
      expect(results.item).toEqual({ id: 'id1' });
      expect(client.get).toBeCalledWith({
        Key: { P: 'id1' },
        TableName: 'MainTable',
      });
      expect(client.get).toBeCalledTimes(1);
    });

    it('Model.get no Item expect results undefined ', async () => {
      client.get = jest.fn(() => request({}));
      const results = await userModel.get({ id: 'id1' });
      expect(results.item).toBeUndefined();
    });

    it('Model.get with multiple id', async () => {
      client.get = jest.fn(() => request({ Item: { P: 'id1.id2.id3', S: 'id4' } }));
      const results = await userModel.get({ id: 'id1.id2.id3.id4' });
      expect(results.item).toEqual({ id: 'id1.id2.id3.id4' });
      expect(client.get).toBeCalledWith({
        Key: { P: 'id1.id2.id3', S: 'id4' },
        TableName: 'MainTable',
      });
      expect(client.get).toBeCalledTimes(1);
    });

    it('Model.get with simple single id', async () => {
      client.get = jest.fn(() => request({ Item: { P: 'id1', S: 'id2' } }));
      const results = await userModel.get({ id: 'id1.id2' });
      expect(results.item).toEqual({ id: 'id1.id2' });
      expect(client.get).toBeCalledWith({
        Key: { P: 'id1', S: 'id2' },
        TableName: 'MainTable',
      });
      expect(client.get).toBeCalledTimes(1);
    });

    it('Model.get with full data', async () => {
      client.get = jest.fn(() =>
        request({
          Item: {
            G0S: 'new york;new york;usa',
            P: 'id1',
            S: 'id2',
            adult: true,
            children: [
              {
                name: 'child1',
                age: 7,
                adult: false,
              },
              {
                name: 'child2',
                age: 10,
                adult: false,
              },
            ],
            count: 2,
            created: 1585563302,
            desc: 'user description',
            groups: {
              group1: { role: 0 },
              group3: { role: 1 },
            },
            interests: table.createStringSet(['basketball', 'soccer', 'football']),
            modified: table.createNumberSet([1585553302, 1585563302]),
            name: 'name1',
            photo: Buffer.from('Photo Buffer'),
            rev: 1,
            spouse: {
              age: 40,
              married: true,
              name: 'spouse',
            },
          },
        }),
      );
      const results = await userModel.get({ id: 'id1.id2' });
      // Ensure item can be case to javascript native type
      const item: ApiUserModel | undefined = results.item;
      expect(item).toEqual({
        adult: true,
        children: [
          {
            adult: false,
            age: 7,
            name: 'child1',
          },
          {
            adult: false,
            age: 10,
            name: 'child2',
          },
        ],
        city: 'new york',
        count: 2,
        country: 'usa',
        created: 1585563302,
        description: 'user description',
        groups: {
          group1: { role: 0 },
          group3: { role: 1 },
        },
        id: 'id1.id2',
        interests: table.createStringSet(['basketball', 'soccer', 'football']),
        modified: table.createNumberSet([1585553302, 1585563302]),
        name: 'name1',
        photo: Buffer.from('Photo Buffer'),
        revision: 1,
        spouse: {
          age: 40,
          married: true,
          name: 'spouse',
        },
        state: 'new york',
        updated: 1585563302,
      });
      expect(client.get).toBeCalledWith({
        Key: { P: 'id1', S: 'id2' },
        TableName: 'MainTable',
      });
      expect(client.get).toBeCalledTimes(1);
    });

    it('Model.delete', async () => {
      client.delete = jest.fn(() => request({ Attributes: { P: 'id1', S: 'id2' } }));
      const results = await userModel.delete({ id: 'id1.id2' });
      expect(results.item).toEqual({ id: 'id1.id2' });
      expect(client.delete).toBeCalledWith({
        Key: { P: 'id1', S: 'id2' },
        TableName: 'MainTable',
      });
      expect(client.delete).toBeCalledTimes(1);
    });

    it('Model.delete Attributes missing expect results undefined', async () => {
      client.delete = jest.fn(() => request({}));
      const results = await userModel.delete({ id: 'id1.id2' });
      expect(results.item).toBeUndefined();
    });

    describe('put based methods', () => {
      const putModelData = {
        id: 'id1.id2',
        name: 'name1',
        revision: 1,
        adult: true,
      };
      const putResultsData = {
        ...putModelData,
        created: 1585563302,
        nickname: 'none',
        updated: 1585563302,
      };
      const putTableItem = {
        adult: true,
        P: 'id1',
        S: 'id2',
        name: 'name1',
        nickname: 'none',
        created: 1585563302,
        rev: 1,
      };
      it('Model.put', async () => {
        client.put = jest.fn(() => request({ Attributes: { P: 'id1', S: 'id2' } }));
        const results = await userModel.put(putModelData);
        expect(results.item).toEqual(putResultsData);
        expect(client.put).toBeCalledWith({
          Item: putTableItem,
          TableName: 'MainTable',
        });
        expect(client.put).toBeCalledTimes(1);
      });

      it('Model.create', async () => {
        client.put = jest.fn(() => request({ Attributes: { P: 'id1', S: 'id2' } }));
        const results = await userModel.create(putModelData);
        expect(results.item).toEqual(putResultsData);
        expect(client.put).toBeCalledWith({
          ConditionExpression: 'attribute_not_exists(#n0)',
          ExpressionAttributeNames: { '#n0': 'P' },
          Item: putTableItem,
          TableName: 'MainTable',
        });
        expect(client.put).toBeCalledTimes(1);
      });

      it('Model.replace', async () => {
        client.put = jest.fn(() => request({ Attributes: { P: 'id1', S: 'id2' } }));
        const results = await userModel.replace(putModelData);
        expect(results.item).toEqual(putResultsData);
        expect(client.put).toBeCalledWith({
          ConditionExpression: 'attribute_exists(#n0)',
          ExpressionAttributeNames: { '#n0': 'P' },
          Item: putTableItem,
          TableName: 'MainTable',
        });
        expect(client.put).toBeCalledTimes(1);
      });
    });

    it('Model.update min args', async () => {
      client.update = jest.fn(() => request({ Attributes: { P: 'id1', S: 'id2' } }));
      const results = await userModel.update({
        id: 'id1.id2',
      });
      expect(results.item).toEqual({ id: 'id1.id2' });
      expect(client.update).toBeCalledWith({
        ExpressionAttributeNames: {
          '#n0': 'rev',
          '#n1': 'updated',
        },
        ExpressionAttributeValues: {
          ':v0': 1,
          ':v1': 1585563303,
        },
        Key: { P: 'id1', S: 'id2' },
        ReturnValues: 'ALL_NEW',
        TableName: 'MainTable',
        UpdateExpression: 'SET #n0 = #n0 + :v0, #n1 = :v1',
      });
      expect(client.update).toBeCalledTimes(1);
    });

    it('Model.update Attributes missing expect results undefined', async () => {
      client.update = jest.fn(() => request({}));
      const results = await userModel.update({
        id: 'id1.id2',
      });
      expect(results.item).toBeUndefined();
    });

    it('Model.update with all fields', async () => {
      client.update = jest.fn(() =>
        request({
          Attributes: {
            P: 'id1',
            S: 'id2',
            rev: 2,
            G0S: 'hudson;wi;usa',
            created: 1585553202,
          },
        }),
      );
      const results = await userModel.update({
        id: 'id1.id2',
        name: 'new name',
        city: 'kirkland',
        state: 'wa',
        country: 'usa',
      });
      expect(results.item).toEqual({
        id: 'id1.id2',
        revision: 2,
        city: 'hudson',
        state: 'wi',
        country: 'usa',
        created: 1585553202,
        updated: 1585553202,
      });
      expect(client.update).toBeCalledWith({
        ExpressionAttributeNames: {
          '#n0': 'G0S',
          '#n1': 'name',
          '#n2': 'rev',
          '#n3': 'updated',
        },
        ExpressionAttributeValues: {
          ':v0': 'kirkland;wa;usa',
          ':v1': 'new name',
          ':v2': 1,
          ':v3': 1585563303,
        },
        Key: { P: 'id1', S: 'id2' },
        ReturnValues: 'ALL_NEW',
        TableName: 'MainTable',
        UpdateExpression: 'SET #n0 = :v0, #n1 = :v1, #n2 = #n2 + :v2, #n3 = :v3',
      });
      expect(client.update).toBeCalledTimes(1);
    });
  });
});
