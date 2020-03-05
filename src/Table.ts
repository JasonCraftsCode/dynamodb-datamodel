import {PartitionKeyType, SortKeyType, IndexProjection} from "./Enums"
import { IGSI, GSI } from "./GSI";
import { ILSI } from "./LSI";

export class Table<PK, SK> {
    name: string;
    partitionKey: string;
    partitionKeyType: PartitionKeyType;
    sortKey?: string;
    sortKeyType?: SortKeyType;
    globalIndexes?: IGSI[];
    localIndexes?: ILSI[];
    options?: string;

    constructor(name: string, pk: string = 'P', sk?: string, gsi?: IGSI[], lsi?: ILSI[]) {
        this.name = name;
        this.partitionKey = pk;
        this.sortKey = sk;
        this.globalIndexes = gsi;
        this.localIndexes = lsi;
    }

    createModel(schema: string, options: string) {

    }

    pk() {
        return {type: this.partitionKeyType, alias: this.partitionKey};
    }

    sk() {
        return {type: this.sortKeyType, alias: this.sortKey};
    }

    // combine two or more dynamodb attributes into a single model attribute like id
    combine(fields: string[], delimiter = '.') {
        return {type: 'string', op: 'combine', aliases: fields, delimiter};
    }

    // combine two or more model attributes into a single dynamodb attribute like location
    // TODO: how do we make it easy to build a query for this data?
    composite(fields: string[], delimiter) {
        return {type: 'string', op: 'combine', aliases: fields, delimiter};
    }
};

const gsi0 = new GSI<string, string>('GSI0', IndexProjection.All, 'P0', 'S0');
const gsi0sk = gsi0.compositeSortKey(3, '.');

const table = new Table<string, string>('testTableName', 'P', 'S');

const model = table.createModel({
    id: table.pk(),
    name: table.string(),
    city: gsi0sk[0],
    state: gsi0sk[1],
    country: gsi0sk[2],
}, {

});

const data = {
    id: 'abc.xyz',
    name: "name of",
    city: "Seattle",
    state: "Washington",
    country: "United States Of America"
}

model.validateModel(data);
const params = model.putParams(data);
const result = dynamodb.put(params);
const modelData = model.parsePut(result);


model.put(data);
