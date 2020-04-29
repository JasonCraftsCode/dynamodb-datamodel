import { AWSError, Request } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import * as yup from 'yup';
import * as joi from '@hapi/joi';

import { Fields } from '../src/Fields';
import { Model } from '../src/Model';
import { Table, Index } from '../src/Table';
import { Update } from '../src/Update';
import { delay } from './testCommon';

const client = new DocumentClient({ convertEmptyValues: true });
const request = (out: any) => {
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

const gsi0 = Index.createIndex<GSI0Key>({
  name: 'GSI0',
  keySchema: {
    G0P: Table.PrimaryKey.PartitionKeyType,
    G0S: Table.PrimaryKey.SortKeyType,
  },
  projection: { type: 'ALL' },
});

const lsi0 = Index.createIndex<LSI0Key>({
  name: 'LSI0',
  keySchema: {
    P: Table.PrimaryKey.PartitionKeyType,
    L0S: Table.PrimaryKey.SortKeyType,
  },
  projection: { type: 'ALL' },
});

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
  globalIndexes: [gsi0 as Index],
  localIndexes: [lsi0 as Index],
  client,
});

const location = Fields.namedComposite('G0S', {
  city: 0,
  state: 1,
  country: 2,
});

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
  name: string;
  age: number;
  married: boolean;
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

interface UserModel extends UserKey {
  city?: string;
  state?: string;
  country?: string;
  name: string | Update.UpdateString;
  count?: number | Update.UpdateNumber;
  description?: string | Update.UpdateString;
  revision: number | Update.UpdateNumber;
  adult: boolean | Update.UpdateBoolean;
  photo?: Table.BinaryValue | Update.UpdateBinary;
  interests?: Table.StringSetValue | Update.UpdateStringSet;
  modified?: Table.NumberSetValue | Update.UpdateNumberSet;
  spouse?: SpouseModel | Update.UpdateMap;
  children?: ChildModel[] | Update.UpdateList;
  groups?: { [key: string]: GroupModel } | Update.UpdateMap;
  created?: Date | Update.UpdateInput<'Date'>;
  hide?: Set<Date>;
  nickname?: string | Update.UpdateString;
  rangeYup?: number | Update.UpdateNumber;
  rangeJoi?: number | Update.UpdateNumber;
}

const userSchema = {
  id: Fields.split(['P', 'S']),
  city: location.slots.city(),
  state: location.slots.state(),
  country: location.slots.country(),
  name: Fields.string(),
  count: Fields.number(),
  description: Fields.string('desc'),
  revision: Fields.number('rev'),
  adult: Fields.boolean(),
  photo: Fields.binary(),
  interests: Fields.stringSet(),
  modified: Fields.numberSet(),
  children: Fields.listT<ChildModel, 'L'>('Child', childSchema),
  spouse: Fields.object<SpouseModel, 'M'>('Spouse', spouseSchema),
  groups: Fields.mapT<GroupModel, 'M'>('Groups', groupSchema),
  created: Fields.date(),
  hide: Fields.hidden(),
  nickname: Fields.string().default('none'),
  rangeYup: Fields.number().yup(yup.number().integer().positive()),
  rangeJoi: Fields.number().joi(joi.number().integer().positive()),
};

const userModel = Model.createModel<UserKey, UserModel>({
  schema: userSchema,
  table: table as Table,
});

describe('Validate Model with Table and Indexes', () => {
  describe('model params', () => {
    it('Model.getParams with single id', async () => {
      // TODO: should probably throw in SplitField
      const params = await userModel.getParams({ id: 'id1' });
      expect(params).toEqual({
        Key: {
          P: 'id1',
        },
        TableName: 'MainTable',
      });
    });

    it('Model.getParams with multiple id', async () => {
      // TODO: should probably throw in SplitField
      const params = await userModel.getParams({ id: 'id1.id2.id3.id4' });
      expect(params).toEqual({
        Key: {
          P: 'id1.id2.id3',
          S: 'id4',
        },
        TableName: 'MainTable',
      });
    });

    it('Model.getParams with single id', async () => {
      const params = await userModel.getParams({ id: 'id1.id2' });
      expect(params).toEqual({
        Key: {
          P: 'id1',
          S: 'id2',
        },
        TableName: 'MainTable',
      });
    });

    it('Model.deleteParams', async () => {
      const params = await userModel.deleteParams({ id: 'id1.id2' });
      expect(params).toEqual({
        Key: {
          P: 'id1',
          S: 'id2',
        },
        TableName: 'MainTable',
      });
    });

    it('Model.putParams with min fields', async () => {
      const params = await userModel.putParams({
        id: 'id1.id2',
        name: 'name1',
        revision: 1,
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
        },
        TableName: 'MainTable',
      });
    });

    it('Model.putParams with all fields', async () => {
      const params = await userModel.putParams({
        id: 'id1.id2',
        name: 'name1',
        revision: 1,
        adult: true,
        city: 'new york',
        state: 'new york',
        country: 'usa',
        description: 'user desription',
        count: 2,
        created: new Date(1585563302000),
        photo: Buffer.from('abcdefghijklmn'),
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
        rangeYup: 1,
        rangeJoi: 2,
      });
      expect(params).toEqual({
        Item: {
          G0S: 'new york.new york.usa',
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
          desc: 'user desription',
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
          photo: Buffer.from('abcdefghijklmn'),
          rev: 1,
          spouse: {
            age: 40,
            married: true,
            name: 'spouse',
          },
          rangeJoi: 2,
          rangeYup: 1,
        },
        TableName: 'MainTable',
      });
    });

    it('Model.updateParams min args', async () => {
      const params = await userModel.updateParams({
        id: 'id1.id2',
      });
      expect(params).toEqual({
        Key: {
          P: 'id1',
          S: 'id2',
        },
        TableName: 'MainTable',
      });
    });

    it('Model.updateParams with all fields', async () => {
      const params = await userModel.updateParams({
        id: 'id1.id2',
        name: Update.set('new name'),
        revision: Update.inc(1),
        city: 'kirkland',
        state: 'wa',
        country: 'usa',
        created: new Date(1585553302000),
        description: null,
        adult: Update.del(),
        count: Update.add('revision', 3),
        spouse: Update.map({
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
          '#n19': 'created',
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
          ':v0': 'kirkland.wa.usa',
          ':v1': 'new name',
          ':v10': {
            role: 3,
          },
          ':v11': 1585553302,
          ':v2': 3,
          ':v3': 1,
          ':v4': table.createStringSet(['soccer', 'football']),
          ':v5': table.createNumberSet([1585533302, 1585543302]),
          ':v6': [
            {
              adult: false,
              age: 3,
              name: 'child3',
            },
          ],
          ':v7': 1,
          ':v8': 'new spouse',
          ':v9': 2,
        },
        Key: {
          P: 'id1',
          S: 'id2',
        },
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
      client.get = jest.fn((params) => request({ Item: { P: 'id1' } }));
      // TODO: should probably throw in SplitField
      const results = await userModel.get({ id: 'id1' });
      expect(results).toEqual({ id: 'id1' });
      expect(client.get).toBeCalledWith({
        Key: { P: 'id1' },
        TableName: 'MainTable',
      });
      expect(client.get).toBeCalledTimes(1);
    });

    it('Model.get no Item expect results undefined ', async () => {
      client.get = jest.fn((params) => request({}));
      const results = await userModel.get({ id: 'id1' });
      expect(results).toBeUndefined();
    });

    it('Model.get with multiple id', async () => {
      client.get = jest.fn((params) => request({ Item: { P: 'id1.id2.id3', S: 'id4' } }));
      const results = await userModel.get({ id: 'id1.id2.id3.id4' });
      expect(results).toEqual({ id: 'id1.id2.id3.id4' });
      expect(client.get).toBeCalledWith({
        Key: { P: 'id1.id2.id3', S: 'id4' },
        TableName: 'MainTable',
      });
      expect(client.get).toBeCalledTimes(1);
    });

    it('Model.get with single id', async () => {
      client.get = jest.fn((params) => request({ Item: { P: 'id1', S: 'id2' } }));
      const results = await userModel.get({ id: 'id1.id2' });
      expect(results).toEqual({ id: 'id1.id2' });
      expect(client.get).toBeCalledWith({
        Key: {
          P: 'id1',
          S: 'id2',
        },
        TableName: 'MainTable',
      });
      expect(client.get).toBeCalledTimes(1);
    });

    it('Model.get with full data', async () => {
      client.get = jest.fn((params) =>
        request({
          Item: {
            G0S: 'new york.new york.usa',
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
            desc: 'user desription',
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
            photo: Buffer.from('abcdefghijklmn'),
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
      expect(results).toEqual({
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
        created: new Date('2020-03-30T10:15:02.000Z'),
        description: 'user desription',
        groups: {
          group1: {
            role: 0,
          },
          group3: {
            role: 1,
          },
        },
        id: 'id1.id2',
        interests: table.createStringSet(['basketball', 'soccer', 'football']),
        modified: table.createNumberSet([1585553302, 1585563302]),
        name: 'name1',
        photo: Buffer.from('abcdefghijklmn'),
        revision: 1,
        spouse: {
          age: 40,
          married: true,
          name: 'spouse',
        },
        state: 'new york',
      });
      expect(client.get).toBeCalledWith({
        Key: {
          P: 'id1',
          S: 'id2',
        },
        TableName: 'MainTable',
      });
      expect(client.get).toBeCalledTimes(1);
    });

    it('Model.delete', async () => {
      client.delete = jest.fn((params) => request({ Attributes: { P: 'id1', S: 'id2' } }));
      const results = await userModel.delete({ id: 'id1.id2' });
      expect(results).toEqual({ id: 'id1.id2' });
      expect(client.delete).toBeCalledWith({
        Key: { P: 'id1', S: 'id2' },
        TableName: 'MainTable',
      });
      expect(client.delete).toBeCalledTimes(1);
    });

    it('Model.delete Attributes missing expect results undefined', async () => {
      client.delete = jest.fn((params) => request({}));
      const results = await userModel.delete({ id: 'id1.id2' });
      expect(results).toBeUndefined();
    });

    it('Model.put', async () => {
      client.put = jest.fn((params) => request({ Attributes: { P: 'id1', S: 'id2' } }));
      const results = await userModel.put({
        id: 'id1.id2',
        name: 'name1',
        revision: 1,
        adult: true,
      });
      expect(results).toEqual({
        adult: true,
        id: 'id1.id2',
        name: 'name1',
        nickname: 'none',
        revision: 1,
      });
      expect(client.put).toBeCalledWith({
        Item: {
          adult: true,
          P: 'id1',
          S: 'id2',
          name: 'name1',
          nickname: 'none',
          rev: 1,
        },
        TableName: 'MainTable',
      });
      expect(client.put).toBeCalledTimes(1);
    });

    it('Model.update min args', async () => {
      client.update = jest.fn((params) => request({ Attributes: { P: 'id1', S: 'id2' } }));
      const results = await userModel.update({
        id: 'id1.id2',
      });
      expect(results).toEqual({ id: 'id1.id2' });
      expect(client.update).toBeCalledWith({
        Key: {
          P: 'id1',
          S: 'id2',
        },
        TableName: 'MainTable',
      });
      expect(client.update).toBeCalledTimes(1);
    });

    it('Model.update Attributes missing expect results undefined', async () => {
      client.update = jest.fn((params) => request({}));
      const results = await userModel.update({
        id: 'id1.id2',
      });
      expect(results).toBeUndefined();
    });

    it('Model.update with all fields', async () => {
      client.update = jest.fn((params) =>
        request({
          Attributes: {
            P: 'id1',
            S: 'id2',
            rev: 2,
            G0S: 'hudson.wi.usa',
            created: 1585553202,
          },
        }),
      );
      const results = await userModel.update({
        id: 'id1.id2',
        name: 'new name',
        revision: Update.inc(1),
        city: 'kirkland',
        state: 'wa',
        country: 'usa',
        created: new Date(1585553302000),
      });
      expect(results).toEqual({
        id: 'id1.id2',
        revision: 2,
        city: 'hudson',
        state: 'wi',
        country: 'usa',
        created: new Date(1585553202000),
      });
      expect(client.update).toBeCalledWith({
        ExpressionAttributeNames: {
          '#n0': 'G0S',
          '#n1': 'name',
          '#n2': 'rev',
          '#n3': 'created',
        },
        ExpressionAttributeValues: {
          ':v0': 'kirkland.wa.usa',
          ':v1': 'new name',
          ':v2': 1,
          ':v3': 1585553302,
        },
        Key: {
          P: 'id1',
          S: 'id2',
        },
        TableName: 'MainTable',
        UpdateExpression: 'SET #n0 = :v0, #n1 = :v1, #n2 = #n2 + :v2, #n3 = :v3',
      });
      expect(client.update).toBeCalledTimes(1);
    });
  });
});
