import { Trade } from "./tradeModels";

export class Account {
    id?: string;
    originalId?: string;
    name: string;
    broker: string;
    symbol2: string;
    userId?: string;
    trades: Trade[] = [];

    constructor(name: string, broker: string, symbol2: string, originalId?: string) {
        this.originalId = originalId;
        this.name = name;
        this.broker = broker;
        this.symbol2 = symbol2;
    }

    addTrades(trades: Trade[]) {
        this.trades.push(...trades);
    }

    calculateStats() {

    }
}