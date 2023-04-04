import type { FormatParts } from '../types';
import {
    DecimalFormat,
    Format
} from '../constants';
import { getFormatParts, getFractionDigits, truncateFractionDigits } from '../helpers';

export interface State {
    hasDecimal: boolean;
    isDecimal: boolean;
    numericValue: number;
    rawValue: string;
    unformattedValue: string;
    value: string;
}

export default class InterActiveFormatter extends Intl.NumberFormat {
    #baseType: DecimalFormat;

    #formatOptions: Intl.NumberFormatOptions;

    #rawValue: string;

    #regExp: {
        decimal: RegExp;
        decimalEnd: RegExp;
        suffix: RegExp;
        unformat: RegExp;
    };

    #type: Format;

    formatParts: FormatParts;

    isIntType: boolean;

    constructor(locale: string, formatOptions: Intl.NumberFormatOptions) {
        const type = (formatOptions.style || 'decimal') as Format;
        const isIntType = /Int/.test(type);

        if (isIntType) {
            formatOptions.style = formatOptions.style.replace(/Int/, '');
            formatOptions.maximumFractionDigits = 0;
            formatOptions.minimumFractionDigits = 0;
        }

        super(locale, formatOptions);

        const { style, currency } = this.#formatOptions;
        this.#formatOptions = super.resolvedOptions();
        this.isIntType = isIntType;
        this.#type = type;
        this.#baseType = style as DecimalFormat;
        this.formatParts = getFormatParts({ currency, locale })[style];
        this.#regExp.decimalEnd = new RegExp(`\\${this.formatParts.decimal}$`);
        this.#regExp.decimal = new RegExp(`\\${this.formatParts.decimal}`);
        this.#regExp.unformat = new RegExp(`[^\\d\\${this.formatParts.decimal}-]`, 'g');
        this.#regExp.suffix = new RegExp(`${this.formatParts.suffix}$`);
    }

    get state(): State {
        if (!this.#rawValue) {
            return undefined;
        }

        const value = this.interactiveFormat();
        const unformattedValue = this.unformat();

        return {
            hasDecimal: this.#regExp.decimal.test(value),
            isDecimal: this.#regExp.decimalEnd.test(value),
            numericValue: !this.isIntType ? parseFloat(unformattedValue) : parseInt(unformattedValue, 10),
            rawValue: this.#rawValue,
            unformattedValue,
            value,
        };
    }

    interactiveFormat(input?: string): string {
        const unformattedValue = input ? this.unformat(input) : this.state.unformattedValue;
        const numericValue = this.parseNumber(unformattedValue);

        if (this.isIntType) {
            return this.format(numericValue);
        }

        const { maximumFractionDigits } = this.#formatOptions;
        const fractionDigits = getFractionDigits(numericValue);
        const { decimal, suffix } = this.formatParts;
        const { isDecimal, hasDecimal } = this.state;
        let value: number;

        if (fractionDigits >= maximumFractionDigits) {
            value = truncateFractionDigits(numericValue, maximumFractionDigits);
        }

        let string = this.format(value / (this.#baseType === 'percent' ? 100 : 1));

        if (suffix) {
            string = string.replace(this.#regExp.suffix, '');
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

        string = `${string}${isDecimal ? decimal : ''}`;

        if (this.formatParts.position === 'end') {
            string = string.replace(this.#regExp.suffix, '');
        }

        return string;
    }

    parseNumber(value: string): number {
        value = this.unformat(value);
        return !this.isIntType ? parseFloat(value) : parseInt(value, 10);
    }

    resolvedOptions(): Intl.ResolvedNumberFormatOptions {
        const options = super.resolvedOptions();
        options.style = this.#type;
        return options;
    }

    set(input: string): void {
        this.#rawValue = input;
        this.#rawValue = this.state.value;
    }

    unformat(value: string = this.state.value): string {
        return value.replace(this.#regExp.unformat, '').replace(this.formatParts.decimal, '.');
    }
}
