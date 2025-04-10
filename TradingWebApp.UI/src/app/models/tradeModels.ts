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
    fee: number;
    currency?: string;
    amount: number;
    broker?: string;
    brokerAccount?: string;
    originalComment?: string;
    comments: MyComment[];
    wasDone: boolean;
    shouldBeOnMinus?: boolean;
    originalValue?: number;
}

export interface UITrade extends Trade {
    calculatedValue?: number;
}

export interface UITradeInstrument {
    symbol: string;
    name?: string;
    currentAmount: number;
    currentPrice?: number;
    currentProfit?: number;
    currentProfitPercent?: number;
    meanBuyPrice: number;
    meanSellPrice: number;
    pastProfit: number;
    pastProfitPercent: number;
    meanPastProfitPercentPerMonth: number;
    trades: UITrade[];
}

export interface MyComment {
    id?: string;
    date?: Date;
    comment: string;
}