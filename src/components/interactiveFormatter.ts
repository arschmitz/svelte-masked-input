import type {
    FormatParts,
    InteractiveFormatterOptions,
} from '../types';
import {
    DecimalFormat,
    DEFAULT_OPTIONS,
    Format
} from '../constants';
import { getFormatParts, getFractionDigits, truncateFractionDigits } from '../helpers';

export default class InterActiveFormatter {
    baseType: DecimalFormat;

    cursorPosition: number;

    decimalEndRegExp: RegExp;

    decimalRegExp: RegExp;

    formatOptions: Intl.NumberFormatOptions;

    formatParts: FormatParts;

    formatter: Intl.NumberFormat['format'];

    isDecimalType: boolean;

    rawValue: string;

    type: Format;

    unformatRegExp: RegExp;

    valueLength: number;

    constructor({ locale, currency, formatOptions, type }: InteractiveFormatterOptions) {
        super();
        this.formatOptions = {
            ...DEFAULT_OPTIONS[this.type],
            ...formatOptions,
            currency,
        };
        this.type = type;
        this.isDecimalType = /int/i.test(type);
        this.formatParts = getFormatParts({ currency, locale })[type];
        this.decimalEndRegExp = new RegExp(`\\${this.formatParts.decimal}$`);
        this.decimalRegExp = new RegExp(`\\${this.formatParts.decimal}`);
        this.unformatRegExp = new RegExp(`[^\\d\\${this.formatParts.decimal}-]`, 'g');
        this.formatter = new Intl.NumberFormat(locale, this.formatOptions).format;
    }

    get hasDecimal(): boolean {
        return this.decimalRegExp.test(this.value);
    }

    get isDecimal(): boolean {
        return this.decimalEndRegExp.test(this.value);
    }

    get numericValue(): number {
        return this.isDecimalType ? parseFloat(this.unformattedValue) : parseInt(this.unformattedValue, 10);
    }

    get unformattedValue(): string {
        return this.unformat();
    }

    get value(): string {
        return this.getLabel(this.trimInput()) || '';
    }

    format(input: string): void {
        this.rawValue = input;
        this.rawValue = this.value;
    }

    getLabel(value: string): string {
        if (!value) {
            return '';
        }

        if (this.formatParts.position === 'end') {
            const replacement = new RegExp(`${this.formatParts.suffix}$`);
            value = value.replace(replacement, '');
        }

        return value;
    }

    getNumber(value: string): number {
        value = this.unformat(value);
        return this.isDecimalType ? parseFloat(value) : parseInt(value, 10);
    }

    trimInput(input?: string): string {
        const unformattedValue = input ? this.unformat(input) : this.unformattedValue;
        const numericValue = this.getNumber(unformattedValue);

        if (!this.isDecimalType) {
            return this.formatter(numericValue);
        }

        const { maximumFractionDigits } = this.formatOptions;
        const fractionDigits = getFractionDigits(numericValue);
        const { decimal, suffix } = this.formatParts;
        const { isDecimal, hasDecimal } = this;
        let value: number;

        if (fractionDigits >= maximumFractionDigits) {
            value = truncateFractionDigits(numericValue, maximumFractionDigits);
        }

        let string = this.formatter(value / (this.type === 'percent' ? 100 : 1));

        if (suffix) {
            string = string.replace(new RegExp(`${suffix}$`), '');
        }

        const [intPart, decimalPart] = string.split(decimal);
        const [, strippedDecimalPart] = unformattedValue.split('.');

        if (
            hasDecimal
            && !isDecimal
            && decimalPart !== strippedDecimalPart
        ) {
            string = [
                intPart,
                strippedDecimalPart?.substring(0, maximumFractionDigits),
            ].join(decimal);
        }

        return `${string}${isDecimal ? decimal : ''}`;
    }

    unformat(value: string = this.value): string {
        return value.replace(this.unformatRegExp, '').replace(this.formatParts.decimal, '.');
    }
}
