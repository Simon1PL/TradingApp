import { Trade } from "./tradeModels";

export class DataConverter {
    private maxRowsToHeader = 15;
    private headersMappings: HeaderFieldMapping[] = [];
    private beforeHeaderFieldsMappings: BeforeHeaderFieldMapping[] = [];

    constructor(headersMappings: HeaderFieldMapping[], beforeHeaderFieldsMappings: BeforeHeaderFieldMapping[]) {
        this.headersMappings = headersMappings;
        this.beforeHeaderFieldsMappings = beforeHeaderFieldsMappings;
    }

    convert(data: string[][]): Trade[] {
        const headerIndex = this.findHeaderIndexAndFillHeaderMappingsFieldsIndexes(data);
        this.getFieldsBeforeHeader(data.slice(0, headerIndex));
        
        const dataRows = data.slice(headerIndex + 1);
        let result: Trade[] = [];
        for (const row of dataRows) {
            const trade: Trade = {} as Trade;
            for (const mapping of this.headersMappings) {
                if (mapping.mapFromIndex !== null) {
                    (trade as any)[mapping.mapTo] = row[mapping.mapFromIndex];
                }
            }

            this.beforeHeaderFieldsMappings.forEach(mapping => {
                if (mapping.value !== null) {
                    (trade as any)[mapping.mapTo] = mapping.value;
                }
            });

            result.push(trade);
        }

        return result;
    }

    private getFieldsBeforeHeader(rows: string[][]): void {
        for (let rowNumber = 0; rowNumber < rows.length; rowNumber++) {
          for (let cellNumber = 0; cellNumber < rows[rowNumber].length; cellNumber++) {
            const cell = rows[rowNumber][cellNumber];
            for (const fieldMapping of this.beforeHeaderFieldsMappings) {
              if (cell && cell === fieldMapping.mapFrom) {
                const fieldValue = rows[Number(rowNumber) + (fieldMapping.direction == 'col' ? 1 : 0)][Number(cellNumber) + (fieldMapping.direction == 'row' ? 1 : 0)];
                if (fieldValue) {
                    fieldMapping.value = fieldValue;
                }
              }
            }
          }
        }

        let errorMessage = this.beforeHeaderFieldsMappings
            .filter(x => x.required && !x.value)
            .map(x => `Required field ${x.mapFrom} not found`)
            .join('\n');

        if (errorMessage) {
            throw new Error(errorMessage);
        }
    }
    
    private findHeaderIndexAndFillHeaderMappingsFieldsIndexes(rows: string[][]): number {
        const requiredTextsInHeaderRow = this.headersMappings.filter(x => x.required).map(x => x.mapFrom);
        for (let i = 0; i < Math.min(rows.length, this.maxRowsToHeader); i++) {
          const row = rows[i];
          if (requiredTextsInHeaderRow.every(x => row.includes(x))) {
            this.headersMappings.forEach(mapping => {
                mapping.mapFromIndex = row.indexOf(mapping.mapFrom);
            });

            return i;
          };
        }
    
        throw new Error('Header row not found, required headers: ' + requiredTextsInHeaderRow.join(', '));
    }
}

export class BeforeHeaderFieldMapping {
    constructor(mapFrom: string, mapTo: string, direction: 'col' | 'row' = 'col', required: boolean = true) {
        this.mapFrom = mapFrom;
        this.mapTo = mapTo;
        this.direction = direction;
        this.required = required;
    }

    // data is srting[][]
    mapFrom: string; // field name from data e.g. from excel
    mapTo: string; // field name from Trade model
    direction: 'col' | 'row' = 'col'; // direction where the value of the mapFrom field is in data
    value: string = ''; // value to be set in Trade model
    required: boolean = true; // if the field is required in the data
}

export class HeaderFieldMapping {
    constructor(mapFrom: string, mapTo: string, required: boolean = true) {
        this.mapFrom = mapFrom;
        this.mapTo = mapTo;
        this.required = required;
    }

    mapFrom: string; // field name from data e.g. from excel
    mapTo: string; // field name from Trade model
    required: boolean = true; // if the field is required in the data
    mapFromIndex: number | null = null; // index of the mapFrom field in the data
}