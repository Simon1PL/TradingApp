import { TransactionType } from "./tradeEnums";

export interface Trade {
    id?: string;
    symbol: string;
    date?: Date;
    transactionType: TransactionType;
    originalTransactionId?: string;
    originalTransactionType?: string;
    price: number;
    amount: number;
    broker?: string;
    originalComment?: string;
    comments: MyComment[];
    wasDone: boolean;
}

export interface MyComment {
    id?: string;
    date?: Date;
    comment: string;
}