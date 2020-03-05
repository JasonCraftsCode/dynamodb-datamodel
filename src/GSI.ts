import {PartitionKeyType, SortKeyType, IndexProjection} from "./Enums"

export interface IGSI {
    name: string;
    indexProjection: IndexProjection;
    partitionKey: string;
    partitionKeyType: PartitionKeyType;
    sortKey?: string;
    sortKeyType?: SortKeyType;
    projectionSchema?: string;
};

export class GSI<PT, ST> implements IGSI {
    constructor(name:string, indexProjection: IndexProjection, pk: string, sk: string) {
        this.name = name;
        this.indexProjection = indexProjection;
        this.partitionKey = pk;
        this.sortKey = sk;
    }
    name: string;
    indexProjection: IndexProjection;
    partitionKey: string;
    partitionKeyType: PartitionKeyType;
    sortKey?: string;
    sortKeyType?: SortKeyType;
    projectionSchema?: string;
}