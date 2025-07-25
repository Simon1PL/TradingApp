import BigNumber from "bignumber.js";
import { TransactionType } from "./tradeEnums";
import { Trade } from './tradeModels';
import { PositionsStats } from "./statModels";
import { getHoursAmountFromDate } from '../helpers/tradeHelper';

export class TradeInstrument {
    readonly symbol: string;
    readonly accountId?: string; // can be null if its not for specific account
    readonly currency: string;
    readonly name?: string;

    readonly trades: Trade[] = []; // all trades for this instrument

    longPositionsStats = new PositionsStats();
    shortPositionsStats = new PositionsStats();
    dividendsSum = BigNumber("0");
    dividendsTaxSum = BigNumber("0");
    feesTransactionsSum = BigNumber("0");

    get buyVolume() {
        return this.longPositionsStats.openVolume.plus(this.shortPositionsStats.closeValue);
    }
    get sellVolume() {
        return this.longPositionsStats.closeVolume.plus(this.shortPositionsStats.openValue);
    }
    get closeValue() {
        return this.longPositionsStats.closeValue.plus(this.shortPositionsStats.closeValue);
    }
    get openValue() {
        return this.longPositionsStats.openValue.plus(this.shortPositionsStats.openValue);
    }
    get buyValue() {
        return this.longPositionsStats.openValue.plus(this.shortPositionsStats.closeValue);
    }
    get sellValue() {
        return this.longPositionsStats.closeValue.plus(this.shortPositionsStats.openValue);
    }
    get feesSum() {
        return this.feesTransactionsSum
            .plus(this.longPositionsStats.fees)
            .plus(this.shortPositionsStats.fees);
    }
    get timeHavingPositions() {
        return this.longPositionsStats.timeHavingPositions
            .plus(this.shortPositionsStats.timeHavingPositions);
    }

    constructor(symbol: string, currency: string, accountId?: string) {
        this.symbol = symbol;
        this.currency = currency;
        this.accountId = accountId;
        this.name = ''; // TO DO, sth like this.companiesInfoService.getCompanyName(symbol)?
    }

    get meanBuyPrice(): BigNumber {
        return this.buyValue.div(this.buyVolume);
    }

    get meanSellPrice(): BigNumber {
        return this.sellValue.div(this.sellVolume);
    }

    getProfits(currentPrice = BigNumber(0)) {
        const longPositionsProfit = this.longPositionsStats.valueSpendOnThosePositions
            .plus(this.longPositionsStats.currentVolume.multipliedBy(currentPrice));

        // shortPositionsProfit may not be precisely calculated, because of mean calculation
        const shortPositionsProfit = this.shortPositionsStats.meanCloseValue.minus(this.shortPositionsStats.meanOpenValue)
            .multipliedBy(this.shortPositionsStats.closeVolume)
            .plus(
                this.shortPositionsStats.currentVolume
                    .multipliedBy(this.shortPositionsStats.meanOpenValue.minus(currentPrice))
                );

        const profit: BigNumber = longPositionsProfit
            .plus(shortPositionsProfit)
            .minus(this.feesSum)
            .plus(this.dividendsSum)
            .minus(this.dividendsTaxSum);

        const profitPercent = profit.div(this.openValue).multipliedBy(100);

        const currentPositionsTime = this.longPositionsStats.currentVolume
            .plus(this.shortPositionsStats.currentVolume)
            .multipliedBy(getHoursAmountFromDate(new Date()));

        // this is mean but without reinvestment, not sure what is better... I think with reinvestment?
        // use value instead of volume?
        // timeHavingPositions is rounded for each transaction to full hours since X date, so it may be not precise. e.g. 15:31 is 16 and 16:29 is still 16, so the difference is 0 hours even if it is closer to 1 hour
        const profitPercentPer30Days =  profitPercent.div(
            this.timeHavingPositions
                .plus(currentPositionsTime)
                .div(this.buyVolume)
                .div(24 * 30)
        );

        return {
            profit,
            profitPercent,
            profitPercentPer30Days
        }
    }

    addTrade(trade: Trade) {
        if (trade.symbol !== this.symbol && trade.symbol2 !== this.symbol) {
            console.log(`Trade ${JSON.stringify(trade)} shouldn't be added to instrument ${this.symbol}. It will be ignored.`);
            return;
        }

        let transactionType = trade.transactionType;        
        if (trade.symbol2 === this.symbol && trade.symbol !== trade.symbol2) { // other side trade
            if (transactionType === TransactionType.Buy) {
                transactionType = TransactionType.Sell;
            }
            else if (transactionType === TransactionType.Sell) {
                transactionType = TransactionType.Buy;
            }
            else if (transactionType === TransactionType.Dividend) {
                transactionType = TransactionType.Deposit;
            }
            else if (transactionType === TransactionType.DividendTax) {
                transactionType = TransactionType.Withdrawal;
            }
            else if (transactionType === TransactionType.Fee) {
                transactionType = TransactionType.Fee;
            }
            else {
                console.log(`Trade ${JSON.stringify(trade)} shouldn't be added to instrument ${this.symbol}. It will be ignored.`);
                return;
            }
        }

        this.trades.push(trade);
                    
        const valueAbs = trade.originalValue.abs();
        const isClosePosition = trade.originalValue.gt(0);
        switch (transactionType) {
            case TransactionType.Buy:
                if (isClosePosition) { // closing for short position
                    this.shortPositionsStats.closeVolume = this.shortPositionsStats.closeVolume.plus(trade.amount);
                    this.shortPositionsStats.closeValue = this.shortPositionsStats.closeValue.plus(valueAbs);
                    this.shortPositionsStats.fees = this.shortPositionsStats.fees.plus(trade.fee);
                    this.shortPositionsStats.timeHavingPositions = this.shortPositionsStats.timeHavingPositions.plus(
                        getHoursAmountFromDate(trade.date).multipliedBy(trade.amount)
                    );
                }
                else { // opening for long position
                    this.longPositionsStats.openVolume = this.longPositionsStats.openVolume.plus(trade.amount);
                    this.longPositionsStats.openValue = this.longPositionsStats.openValue.plus(valueAbs);
                    this.longPositionsStats.fees = this.longPositionsStats.fees.plus(trade.fee);
                    this.longPositionsStats.timeHavingPositions = this.longPositionsStats.timeHavingPositions.minus(
                        getHoursAmountFromDate(trade.date).multipliedBy(trade.amount)
                    );
                }
                break;
            case TransactionType.Sell:
                if (isClosePosition) { // closing for long position
                    this.longPositionsStats.closeVolume = this.longPositionsStats.closeVolume.plus(trade.amount);
                    this.longPositionsStats.closeValue = this.longPositionsStats.closeValue.plus(valueAbs);
                    this.longPositionsStats.fees = this.longPositionsStats.fees.plus(trade.fee);
                    this.longPositionsStats.timeHavingPositions = this.longPositionsStats.timeHavingPositions.plus(
                        getHoursAmountFromDate(trade.date).multipliedBy(trade.amount)
                    );
                }
                else { // opening for short position
                    this.shortPositionsStats.openVolume = this.shortPositionsStats.openVolume.plus(trade.amount);
                    this.shortPositionsStats.openValue = this.shortPositionsStats.openValue.plus(valueAbs);
                    this.shortPositionsStats.fees = this.shortPositionsStats.fees.plus(trade.fee);
                    this.shortPositionsStats.timeHavingPositions = this.shortPositionsStats.timeHavingPositions.minus(
                        getHoursAmountFromDate(trade.date).multipliedBy(trade.amount)
                    );
                }
                break;
            case TransactionType.Dividend:
                this.dividendsSum = this.dividendsSum.plus(valueAbs);
                break;
            case TransactionType.DividendTax:
                this.dividendsTaxSum = this.dividendsTaxSum.plus(valueAbs);
                break;
            case TransactionType.Fee:
                this.feesTransactionsSum = this.feesTransactionsSum.plus(valueAbs);
                break;
            case TransactionType.Deposit:
            case TransactionType.FreeFundsInterest:
                this.longPositionsStats.openVolume = this.longPositionsStats.openVolume.plus(trade.amount);
                this.longPositionsStats.timeHavingPositions = this.longPositionsStats.timeHavingPositions.minus(
                    getHoursAmountFromDate(trade.date).multipliedBy(trade.amount)
                );
                break;
            case TransactionType.Withdrawal:
            case TransactionType.Tax:
            case TransactionType.FreeFundsInterestTax:
                this.longPositionsStats.closeVolume = this.longPositionsStats.closeVolume.minus(trade.amount);
                this.longPositionsStats.timeHavingPositions = this.longPositionsStats.timeHavingPositions.plus(
                    getHoursAmountFromDate(trade.date).multipliedBy(trade.amount)
                );
                break;
        }
    }

    addInstrumentWithOtherCurrency(instrument: TradeInstrument, currencyExchangeRate: BigNumber) {
        this.longPositionsStats.addInstrumentWithOtherCurrency(instrument.longPositionsStats, currencyExchangeRate);
        this.shortPositionsStats.addInstrumentWithOtherCurrency(instrument.shortPositionsStats, currencyExchangeRate);

        this.feesTransactionsSum = this.feesTransactionsSum.plus(
            instrument.feesTransactionsSum.multipliedBy(currencyExchangeRate)
        );
        this.dividendsSum = this.dividendsSum.plus(
            instrument.dividendsSum.multipliedBy(currencyExchangeRate)
        );
        this.dividendsTaxSum = this.dividendsTaxSum.plus(
            instrument.dividendsTaxSum.multipliedBy(currencyExchangeRate)
        );
    }
}
