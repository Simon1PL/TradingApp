import { excelDateToJSDate } from '../helpers/excelHelper';
import { getHoursFromMiliseconds } from '../helpers/tradeHelper';
import { TransactionType } from "./tradeEnums";
import BigNumber from "bignumber.js";

export class Trade {
    id?: string;
    originalTransactionId?: string;
    symbol: string = '';
    date: Date;
    originalDate: string = '';
    transactionType: TransactionType = TransactionType.Unknown;
    originalTransactionType?: string;
    fee: BigNumber = BigNumber("0");
    symbol2?: string;
    amount: BigNumber = BigNumber(NaN);
    broker: string = '';
    brokerAccount?: string;
    accountId: string;
    originalComment?: string;
    comments: MyComment[] = [];
    wasDone: boolean = true;
    originalValue: BigNumber = BigNumber(NaN);
    price: BigNumber = BigNumber(NaN); // for xtb the price can be in other currency then the trade, e.g. buying BTC with PLN, the price is in USD, but the original value is in PLN
    leverage: BigNumber = BigNumber(1); // won't be perfect at least for xtb, e.g. 100/33.33

    calculatedValue: BigNumber;
    isClosed: boolean = false;

    closedAmount: BigNumber = BigNumber("0");
    closedValue: BigNumber = BigNumber("0");
    timeHavingPositionInHours: BigNumber = BigNumber("0"); // only for closed amount
    symbolAmountAfterThisTrade: BigNumber = BigNumber("0");
    symbol2AmountAfterThisTrade: BigNumber = BigNumber("0");

    constructor(object: Partial<Trade>) {
        Object.assign(this, object);
        this.price = this.price.abs();
        this.amount = this.amount.abs();
        this.fee = this.fee.abs();
        this.date = object.date ?? excelDateToJSDate(this.originalDate);
        this.accountId = object.accountId!;
        if (!this.symbol) {
            this.symbol = this.symbol2 ?? '';
            this.symbol2 = undefined;
        }

        this.calculatedValue = (this.originalValue.lt(0) ? BigNumber("-1") : BigNumber("1"))
            .multipliedBy(this.price)
            .multipliedBy(this.amount)
            .minus(this.fee);
    }

    updateClosedPart(): void {
        this.isClosed = this.amount.eq(this.closedAmount);
    }

    get costOfCurrentOpenPosition(): BigNumber { // cost of still open part of the trade, without fees
        return this.price.multipliedBy(this.amount.minus(this.closedAmount));
    }

    getProfits(currentPrice = BigNumber(NaN)) {
        // for open positions: What for close positions????
        const profit: BigNumber =
            this.closedValue
                .minus(this.originalValue.div(this.amount).multipliedBy(this.closedAmount)) // originalValue is already on minus!!??! so it should be .plus there?
                .minus(this.fee)
                .plus(
                    this.amount.minus(this.closedAmount)
                        .multipliedBy(currentPrice.minus(this.price))
                );

        const profitPercent = profit.div(this.originalValue).multipliedBy(100);

        const openPositionTime = this.amount.minus(this.closedAmount).multipliedBy(getHoursFromMiliseconds(new Date().getTime() - this.date!.getTime()));
        const profitPercentPer30Days = profitPercent.div(
            this.timeHavingPositionInHours.plus(openPositionTime)
                .div(24 * 30)
        );

        return {
            profit,
            profitPercent,
            profitPercentPer30Days
        }
    }

    static fromPlain(obj: any): Trade {
        return new Trade({
            ...obj,
            fee: BigNumber(obj.fee),
            amount: BigNumber(obj.amount),
            originalValue: BigNumber(obj.originalValue),
            price: BigNumber(obj.price),
            calculatedValue: BigNumber(obj.calculatedValue),
            closedAmount: BigNumber(obj.closedAmount),
            closedValue: BigNumber(obj.closedValue),
            timeHavingPositionInHours: BigNumber(obj.timeHavingPositionInHours),
            symbolAmountAfterThisTrade: BigNumber(obj.symbolAmountAfterThisTrade),
            symbol2AmountAfterThisTrade: BigNumber(obj.symbol2AmountAfterThisTrade),
            date: excelDateToJSDate(obj.originalDate),
        });
    }
}

export interface MyComment {
    id?: string;
    date?: Date;
    comment: string;
}
