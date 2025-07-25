import BigNumber from "bignumber.js";

export class PositionsStats {
    openValue = BigNumber("0"); // SUM(open positions value)
    closeValue = BigNumber("0"); // SUM(close positions value)
    openVolume = BigNumber("0"); // SUM(open positions volume)
    closeVolume = BigNumber("0"); // SUM(close positions volume)
    timeHavingPositions = BigNumber("0"); // SUM(position volume * (position close time - position open time)[ms])
    fees = BigNumber("0"); // SUM(positions fees)

    get currentVolume(): BigNumber {
        return this.openVolume.minus(this.closeVolume);
    }

    get valueSpendOnThosePositions(): BigNumber {
        return this.closeValue.minus(this.openValue);
    }

    get meanOpenValue(): BigNumber {
        if (this.openVolume.isZero()) {
            return BigNumber("0");
        }

        return this.openValue.div(this.openVolume);
    }

    get meanCloseValue(): BigNumber {
        if (this.closeVolume.isZero()) {
            return BigNumber("0");
        }

        return this.closeValue.div(this.closeVolume);
    }

    addInstrumentWithOtherCurrency(stats: PositionsStats, currencyExchangeRate: BigNumber) {
        this.openValue = this.openValue.plus(
            stats.openValue.multipliedBy(currencyExchangeRate)
        );
        this.closeValue = this.closeValue.plus(
            stats.closeValue.multipliedBy(currencyExchangeRate)
        );
        this.openVolume = this.openVolume.plus(
            stats.openVolume.multipliedBy(currencyExchangeRate)
        );
        this.closeVolume = this.closeVolume.plus(
            stats.closeVolume.multipliedBy(currencyExchangeRate)
        );
        this.timeHavingPositions = this.timeHavingPositions.plus(
            stats.timeHavingPositions.multipliedBy(currencyExchangeRate)
        );
        this.fees = this.fees.plus(
            stats.fees.multipliedBy(currencyExchangeRate)
        );
    }
}
