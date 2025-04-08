import { TransactionType } from "./tradeEnums";

export interface Trade {
    id?: string;
    originalTransactionId?: string;
    symbol: string;
    date?: Date;
    originalDate: string;
    transactionType: TransactionType;
    originalTransactionType?: string;
    price: number;
    currency?: string;
    amount: number;
    broker?: string;
    brokerAccount?: string;
    originalComment?: string;
    comments: MyComment[];
    wasDone: boolean;
}

export interface MyComment {
    id?: string;
    date?: Date;
    comment: string;
}