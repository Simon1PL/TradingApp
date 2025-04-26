export function multiplierToMakeTheNumberAnInteger(number: number): number {
    const maxPrecision = 8;
    const amountOfDigits = number.toString().split('.')[1]?.length ?? 0;
    return Math.pow(10, (Math.min(maxPrecision, amountOfDigits)));
}