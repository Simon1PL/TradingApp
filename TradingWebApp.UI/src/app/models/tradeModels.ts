import { TransactionType } from "./tradeEnums";

export class Trade {
    id?: string;
    originalTransactionId?: string;
    symbol: string = '';
    date?: Date;
    originalDate: string = '';
    transactionType: TransactionType = TransactionType.Unknown;
    originalTransactionType?: string;
    fee: number = 0;
    currency?: string;
    amount: number = -1;
    broker: string = '';
    brokerAccount?: string;
    originalComment?: string;
    comments: MyComment[] = [];
    wasDone: boolean = true;
    shouldBeOnMinus: boolean = false;
    originalValue: number = -1;
    price: number = -1;

    isCloseTrade: boolean = false;
    closedAmount: number = 0;
    openTrade?: Trade;

    constructor(object?: Partial<Trade>) {
        Object.assign(this, object);
    }

    get calculatedValue(): number {
        return (this.shouldBeOnMinus ? -1 : 1) * Math.abs(this.price ?? 0) * (this.amount ?? 0) - Math.abs(this.fee ?? 0);
    }

    get profit(): number | null {
        return this.openTrade ? this.originalValue - this.openTrade?.originalValue - this.fee - this.openTrade.fee : null;
    }

    get profitPercent(): number | null {
        return this.openTrade ? this.profit! / this.originalValue * 100 : null;
    }

    get profitPercentPer30Days(): number | null {
        return this.openTrade ? this.profitPercent! / ((this.date!.getTime() - this.openTrade.date!.getTime()) / (1000 * 60 * 60 * 24 * 30)) : null;
    }
}

export interface MyComment {
    id?: string;
    date?: Date;
    comment: string;
}

export class TradesStats {
    currentPositionsStats: CurrentPositionsStats = new CurrentPositionsStats();
    closedPositionsStats: ClosedPositionsStats = new ClosedPositionsStats();
    cashOperationsStats: CashOperationsStats = new CashOperationsStats();
}

export class UITradeInstrument {
    symbol: string;
    name?: string;
    trades: Trade[];

    constructor(symbol: string, trades: Trade[]) {
        this.symbol = symbol;
        this.trades = trades;
    }

    stats: TradesStats = new TradesStats();
}

export class CurrentPositionsStats {
    buyPositionsVolume: number = 0; // SUM(buy positions volume)
    sellPositionsVolume: number = 0; // SUM(sell positions volume)
    timeHavingOpenPositions: number = 0; // SUM(buy position volume * (NOW - buy position open time)[ms]) - SUM(sell position volume * (NOW - sell position open time)[ms])
    buyValue: number = 0; // buy positions value
    sellValue: number = 0; // sell positions value
    currentPrice?: number; // current price of the instrument
    fees: number = 0; // SUM(fees)
    dividends: number = 0; // SUM(dividends)

    get additionalProfit(): number {
        return  this.dividends - this.fees;
    }

    get volume(): number {
        return this.buyPositionsVolume - this.sellPositionsVolume;
    }

    get openValue(): number {
        return this.buyValue - this.sellValue;
    }

    get meanBuyPrice(): number {
        return this.buyPositionsVolume === 0 ? 0 : Math.round(this.buyValue / this.buyPositionsVolume * 1000) / 1000;
    }

    get meanSellPrice(): number {
        return this.sellPositionsVolume === 0 ? 0 : Math.round(this.sellValue / this.sellPositionsVolume * 1000) / 1000;
    }

    get profit(): number | null {
        return this.currentPrice ? this.volume > 0 ? this.volume * (this.currentPrice - this.meanBuyPrice) + this.additionalProfit : this.volume * (this.currentPrice - this.meanBuyPrice) + this.additionalProfit - this.fees : null;
    }

    get profitPercent(): number | null {
        return this.profit ? Math.round(this.profit / Math.abs(this.openValue) * 100 * 100) / 100 : null;
    }

    get profitPercentPer30Days(): number | null {
        return this.profitPercent ? Math.round(this.profitPercent / (this.timeHavingOpenPositions / this.volume / 30 / 24) * 100) / 100 : null;
    }
}

export class ClosedPositionsStats {
    openBuyPositionsVolume: number = 0; // SUM(buy positions volume)
    openSellPositionsVolume: number = 0; // SUM(sell positions volume)
    timeHavingOpenPositions: number = 0; // SUM(position volume * (position close time - position open time)[ms])
    closeValue: number = 0; // value taken out from positions
    openValue: number = 0; // value put into positions
    buyValue: number = 0; // buy positions value
    sellValue: number = 0; // sell positions value
    fees: number = 0; // SUM(fees)
    dividends: number = 0; // SUM(dividends)

    get additionalProfit(): number {
        return (this.dividends * 100 - this.fees * 100) / 100;
    }

    get volume(): number {
        return this.openBuyPositionsVolume + this.openSellPositionsVolume;
    }

    get meanBuyPrice(): number {
        return this.volume === 0 ? 0 : Math.round(this.buyValue / this.volume * 1000) / 1000;
    }

    get meanSellPrice(): number {
        return this.volume === 0 ? 0 : Math.round(this.sellValue / this.volume * 1000) / 1000;
    }

    get profit(): number {
        return (this.closeValue * 100 - this.openValue * 100 + this.additionalProfit * 100 - this.fees * 100) / 100;
    }

    get profitPercent(): number {
        return Math.round(this.profit / this.openValue * 100 * 100) / 100;
    }

    get profitPercentPer30Days(): number {
        return Math.round(this.profitPercent / (this.timeHavingOpenPositions / this.volume / 30 / 24) * 100) / 100;
    }
}

export class CashOperationsStats {
    cashOperationsProfit: number = 0; // SUM(free founds intrest)
    addedCash: number = 0; // SUM(any + operation volume)
    withdrawnCash: number = 0; // SUM(any - operation volume)
    timeHavingCash: number = 0; // SUM(any operation value * time[ms] * (value > 0 ? -1 : 1)) + NOW * currentCash

    get currentCash(): number {
        return this.addedCash - this.withdrawnCash;
    }

    get cashOperationsProfitPercentPer30Days(): number {
        return this.cashOperationsProfit / (this.timeHavingCash / (1000 * 60 * 60 * 24 * 30)) / this.addedCash; // TO DO divide by addedCash?
    }
}