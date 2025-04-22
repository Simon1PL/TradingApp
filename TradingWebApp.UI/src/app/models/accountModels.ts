import { Trade, UITrade } from "./tradeModels";

export class Account {
    id?: string;
    originalId?: string;
    name: string;
    broker: string;
    currency: string;
    userId?: string;
    isDefault: boolean = false;
    trades: Trade[] = [];

    constructor(name: string, broker: string, currency: string, originalId?: string) {
        this.originalId = originalId;
        this.name = name;
        this.broker = broker;
        this.currency = currency;
    }
}