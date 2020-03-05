import { SortKeyType, IndexProjection} from "./Enums"

export interface ILSI {
    name: string;
    sortKey: string;
    sortKeyType: SortKeyType;
    indexProjection: IndexProjection;

};

export class LSI<ST> implements ILSI {
    name: string;
    sortKey: string;
    sortKeyType: SortKeyType;
    indexProjection: IndexProjection;

}