import { TransactionType } from "../models/tradeEnums";
import { Trade, TradesStats } from "../models/tradeModels";

export function isCloseTrade(trade: Trade): boolean {
    return (trade.transactionType === TransactionType.Sell || trade.transactionType === TransactionType.Buy) &&
        (trade.originalValue ?? 0) > 0;
}

export function isOpenTrade(trade: Trade): boolean {
    return (trade.transactionType === TransactionType.Buy || trade.transactionType === TransactionType.Sell) && 
        (trade.originalValue ?? 0) < 0;
}

function getHoursAmountFromDate(date: Date) {
    return Math.round(date.getTime() / (1000 * 60 * 60));
}

export function calculateStats(trades: Trade[]): TradesStats {
    const stats = new TradesStats();
    const dayAmountUpToNow = getHoursAmountFromDate(new Date());
    trades.forEach(trade => {
        const valueAbsX100 = Math.abs(trade.originalValue ?? 0) * 100;
        stats.cashOperationsStats.timeHavingCash -= getHoursAmountFromDate(trade.date!) * trade.originalValue;
        trade.originalValue < 0 ? stats.cashOperationsStats.addedCash += valueAbsX100 : stats.cashOperationsStats.withdrawnCash += valueAbsX100;

        switch (trade.transactionType) {
            case TransactionType.Buy:
                if (trade.originalValue > 0) {  // it is closing sell position
                    stats.closedPositionsStats.sellValue += valueAbsX100;
                    stats.closedPositionsStats.closeValue += valueAbsX100;
                    stats.closedPositionsStats.timeHavingOpenPositions += getHoursAmountFromDate(trade.date!) * trade.amount;
                }
                else { // it is opening buy position
                    if (trade.closedAmount !== trade.amount) { // it is not closed buy position
                        const volume = trade.amount - trade.closedAmount;
                        stats.currentPositionsStats.buyPositionsVolume += volume;
                        stats.currentPositionsStats.timeHavingOpenPositions += volume * (dayAmountUpToNow - getHoursAmountFromDate(trade.date!));
                        stats.currentPositionsStats.buyValue += valueAbsX100;
                        stats.currentPositionsStats.fees += (trade.fee ?? 0) * 100;
                    }
                    else if (trade.closedAmount > 0) { // it is opening for closed buy position
                        stats.closedPositionsStats.openBuyPositionsVolume += trade.closedAmount;
                        stats.closedPositionsStats.timeHavingOpenPositions -= trade.closedAmount * getHoursAmountFromDate(trade.date!);
                        stats.closedPositionsStats.openValue += valueAbsX100;
                        stats.closedPositionsStats.buyValue += valueAbsX100;
                        stats.closedPositionsStats.fees += (trade.fee ?? 0) * 100;
                    }
                }
                break;
            case TransactionType.Sell:
                if (trade.originalValue > 0) { // it is closing buy position
                    stats.closedPositionsStats.sellValue += valueAbsX100;
                    stats.closedPositionsStats.closeValue += valueAbsX100;
                    stats.closedPositionsStats.timeHavingOpenPositions += getHoursAmountFromDate(trade.date!) * trade.amount;
                }
                else { // it is opening sell position
                    if (trade.closedAmount !== trade.amount) { // it is not closed sell position
                        const volume = trade.amount - trade.closedAmount;
                        stats.currentPositionsStats.sellPositionsVolume += volume;
                        stats.currentPositionsStats.timeHavingOpenPositions -= volume * (dayAmountUpToNow - getHoursAmountFromDate(trade.date!));
                        stats.currentPositionsStats.sellValue += valueAbsX100;
                        stats.currentPositionsStats.fees += (trade.fee ?? 0) * 100;
                    }
                    else if (trade.closedAmount > 0) { // it is opening for closed sell position
                        stats.closedPositionsStats.openSellPositionsVolume += trade.closedAmount;
                        stats.closedPositionsStats.timeHavingOpenPositions -= trade.closedAmount * getHoursAmountFromDate(trade.date!);
                        stats.closedPositionsStats.openValue += valueAbsX100;
                        stats.closedPositionsStats.sellValue += valueAbsX100;
                        stats.closedPositionsStats.fees += (trade.fee ?? 0) * 100;
                    }
                }
                break;
            case TransactionType.Dividend:
                stats.closedPositionsStats.dividends += valueAbsX100;
                // stats.currentPositionsStats.dividends += trade.originalValue ?? 0; // we need to know if divident is for current or closed position
                break;
            case TransactionType.Fee:
                stats.closedPositionsStats.fees += valueAbsX100;
                break;
            case TransactionType.Deposit:
            case TransactionType.Withdrawal:
                break;
            case TransactionType.FreeFundsInterest:
                break;
            case TransactionType.Tax:
            case TransactionType.DividendTax:
            case TransactionType.FreeFundsInterestTax:
                break;
        }
    });

    stats.currentPositionsStats.buyValue /= 100;
    stats.currentPositionsStats.sellValue /= 100;
    stats.currentPositionsStats.fees /= 100;
    stats.currentPositionsStats.dividends /= 100;
    stats.closedPositionsStats.buyValue /= 100;
    stats.closedPositionsStats.sellValue /= 100;
    stats.closedPositionsStats.openValue /= 100;
    stats.closedPositionsStats.closeValue /= 100;
    stats.closedPositionsStats.fees /= 100;
    stats.closedPositionsStats.dividends /= 100;
    stats.cashOperationsStats.addedCash /= 100;
    stats.cashOperationsStats.withdrawnCash /= 100;
    stats.cashOperationsStats.timeHavingCash += dayAmountUpToNow * stats.cashOperationsStats.currentCash;
    return stats;
}

export function calculateClosedTrades(trades: Trade[]): void {
    let closedTradesVolumeSum = 0;
    trades.forEach(trade => {
        if (isCloseTrade(trade)) {
            trade.isCloseTrade = true;
            closedTradesVolumeSum += Math.abs(trade.amount ?? 0);
            trade.closedAmount = trade.amount;
        }
    });

    let i = 0;
    while (closedTradesVolumeSum > 0 && i < trades.length) {
        if(trades[i].closedAmount === trades[i].amount) {
            i++;
            continue;
        }
        
        if (trades[i].amount >= closedTradesVolumeSum) {
            trades[i].closedAmount = closedTradesVolumeSum;
            closedTradesVolumeSum = 0;
        }
        else if (trades[i].amount < closedTradesVolumeSum) {
            closedTradesVolumeSum -= trades[i].amount;
            trades[i].closedAmount = trades[i].amount;
        }

        i++;
    }

    if (Math.round(closedTradesVolumeSum * 100) / 100 > 0) {
        console.error('Not all closed trades were closed!');
        console.error(trades);
    }
}