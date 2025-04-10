import { TransactionType } from "../models/tradeEnums";
import { Trade } from "../models/tradeModels";

export function convertDataToTrades(
    data: string[][],
    requiredTextsInHeaderRow: string[],
    nonHeaderFields: NonHeaderField[],
    mappings: TradeFieldsMappings,
): Trade[] {
    let result: Trade[] = [];
    data = JSON.parse(JSON.stringify(data));
    const headerIndex = findRowIndexWithGivenFields(data.slice(0, 15), requiredTextsInHeaderRow);
    const headerRow = data[headerIndex];
    const lastRowIndex = findLastRowIndex(data.slice(headerIndex + 1), headerRow.filter(x => x).length) + headerIndex + 1;
    const dataRows = data.splice(headerIndex + 1, (lastRowIndex - headerIndex));
    const nonDataRows = data;
    fillNonHeaderFieldsValues(nonDataRows, nonHeaderFields);
    const dataObjects: ObjectFromData[] = dataRows.map(row => {
        const obj: ObjectFromData = {};
        for (let i = 0; i < row.length; i++) {
            obj[headerRow[i]] = row[i];
        }

        for (const field of nonHeaderFields) {
            obj[field.fieldName] = field.value ?? '';
        }

        return obj;
    });

    for (const obj of dataObjects) {
        if (mappings.skip && mappings.skip(obj)) {
            continue;
        }

        const trade: Trade = {
            originalTransactionId: mappings.originalTransactionId ? mappings.originalTransactionId(obj) : undefined,
            symbol: mappings.symbol ? mappings.symbol(obj) : '',
            date: mappings.date ? mappings.date(obj) : undefined,
            originalDate: mappings.originalDate ? mappings.originalDate(obj) : '',
            originalTransactionType: mappings.originalTransactionType ? mappings.originalTransactionType(obj) : undefined,
            transactionType: TransactionType.Unknown,
            price: mappings.price ? mappings.price(obj) : 0,
            fee: mappings.fee ? mappings.fee(obj) : 0,
            currency: mappings.currency ? mappings.currency(obj) : undefined,
            amount: mappings.amount ? mappings.amount(obj) : 0,
            broker: mappings.broker ? mappings.broker(obj) : undefined,
            brokerAccount: mappings.brokerAccount ? mappings.brokerAccount(obj) : undefined,
            originalComment: mappings.originalComment ? mappings.originalComment(obj) : undefined,
            wasDone: mappings.wasDone ? mappings.wasDone(obj) : false,
            shouldBeOnMinus: mappings.shouldBeOnMinus ? mappings.shouldBeOnMinus(obj) : undefined,
            comments: [],
            originalValue: mappings.originalValue ? mappings.originalValue(obj) : undefined,
        };

        trade.transactionType = mappings.transactionType(trade.originalTransactionType ?? '');
        if(trade.originalValue) {
            trade.originalValue -= Math.abs(trade.fee);
        }

        result.push(trade);
    }

    return result;
}

function findRowIndexWithGivenFields(rows: string[][], requiredFields: string[]): number {
    for (let i = 0; i < rows.length; i++) {
      if (requiredFields.every(x => rows[i].includes(x))) {
        return i;
      };
    }

    throw new Error('Header row not found, required headers: ' + requiredFields.join(', '));
}

function findLastRowIndex(rows: string[][], headerLength: number): number {
    let notEmptyFieldsAmount = 0;
    for (let row = 0; row < rows.length; row++) {
        let currentRowNotEmptyFieldsAmount = 0;
        for (let j = 0; j < headerLength; j++) {
            if (rows[row][j]) {
                currentRowNotEmptyFieldsAmount++;
                notEmptyFieldsAmount++;
            }
        }

        const averageNotEmptyFieldsAmount = (notEmptyFieldsAmount - currentRowNotEmptyFieldsAmount) / row;
        const minFieldsToBeCountedAsRow = averageNotEmptyFieldsAmount / 2;
        if (currentRowNotEmptyFieldsAmount < minFieldsToBeCountedAsRow) {
            return row - 1;
        }
    }

    return rows.length - 1;
}

function fillNonHeaderFieldsValues(rows: string[][], nonHeaderFields: NonHeaderField[]): void {
    for (let row = 0; row < rows.length; row++) {
      for (let column = 0; column < rows[row].length; column++) {
        const cell = rows[row][column];
        for (const fieldMapping of nonHeaderFields) {
          if (cell === fieldMapping.fieldName) {
            const fieldValue = rows[Number(row) + (fieldMapping.direction == 'col' ? 1 : 0)][Number(column) + (fieldMapping.direction == 'row' ? 1 : 0)];
            fieldMapping.value = fieldValue;
            break; // only one field can be found in one cell
          }
        }

        if (nonHeaderFields.every(x => x.value)) {
          return; // all fields have been found
        }
      }
    }

    let errorMessage = nonHeaderFields
        .filter(x => x.required && !x.value)
        .map(x => `Required field ${x.fieldName} not found`)
        .join('\n');

    if (errorMessage) {
        throw new Error(errorMessage);
    }
}

export class NonHeaderField {
    constructor(fieldName: string, direction: 'col' | 'row' = 'col', required: boolean = true) {
        this.fieldName = fieldName;
        this.direction = direction;
        this.required = required;
    }

    fieldName: string;
    direction: 'col' | 'row' = 'col'; // direction where the value of the fieldName field is
    value?: string;
    required: boolean = true;
}

export interface TradeFieldsMappings {
    originalTransactionId?: (x: ObjectFromData) => string;
    symbol: (x: ObjectFromData) => string;
    originalDate: (x: ObjectFromData) => string;
    date?: (x: ObjectFromData) => Date;
    originalTransactionType: (x: ObjectFromData) => string;
    price: (x: ObjectFromData) => number;
    fee?: (x: ObjectFromData) => number;
    currency: (x: ObjectFromData) => string;
    amount: (x: ObjectFromData) => number;
    broker: (x: ObjectFromData) => string;
    brokerAccount?: (x: ObjectFromData) => string;
    originalComment?: (x: ObjectFromData) => string;
    wasDone?: (x: ObjectFromData) => boolean;
    shouldBeOnMinus?: (x: ObjectFromData) => boolean | undefined;
    originalValue?: (x: ObjectFromData) => number;
    transactionType: (originalTransactionType: string) => TransactionType;
    skip?: (x: ObjectFromData) => boolean;
}

interface ObjectFromData {
    [propertyName: string]: string;
}