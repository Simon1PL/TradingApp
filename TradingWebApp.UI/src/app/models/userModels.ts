import { Account } from "./accountModels";

export class User {
    id?: string;
    name: string;
    accounts: Account[] = [];
    defaultAccountName?: string;
    cash: Map<string, number> = this.accounts.reduce((acc, account) => {
        acc.set(account.currency, 0); // TO DO
        return acc;
    }, new Map<string, number>());

    constructor(name: string) {
        this.name = name;
    }
}