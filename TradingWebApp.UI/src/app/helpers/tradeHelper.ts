import BigNumber from "bignumber.js";

export function getHoursAmountFromDate(date: Date): BigNumber {
    return BigNumber(getHoursFromMiliseconds(date.getTime()).toString());
}

export function getHoursFromMiliseconds(miliseconds: number) {
    return Math.round(miliseconds / 1000.0 / 60 / 60);
}
