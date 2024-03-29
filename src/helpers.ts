import type {
    FormatDecimalsInput,
    FormatFunction,
    FormatParts,
    FormatPartsOptions,
    Formatters,
    GetFormatPartsOptions,
    Options,
    StyleFormatParts,
    TrimInputInput
} from './types';
import {
    BACKGROUND_STYLES,
    DecimalFormat,
    FORMATS,
    Format,
    STYLES
} from './constants';

function getFractionDigits(number) {
    return String(number).split('.')[1]?.length;
}

function truncateFractionDigits(number, digits) {
    const [int, decimal] = `${number}`.split('.');

    return parseFloat(`${int}.${decimal.substring(0, digits)}`);
}

export function createStyleElement({ id, styles }: { id: number; styles: CSSStyleDeclaration; }): HTMLStyleElement {
    let styleBody = '';
    STYLES.concat(BACKGROUND_STYLES).forEach((prop) => {
        styleBody += `${prop}: ${styles[prop]}; `;
    });

    const styleClass = `.formatted-input-mask[data-formatted-id="${id}"] { ${styleBody} }`;
    const style = document.createElement('style');
    style.type = 'text/css';
    style.appendChild(document.createTextNode(styleClass));

    return style;
}

const log10 = Math.log(10);

export function formatDecimals(
    {
        currency,
        formatParts: { decimal, suffix },
        formatter,
        strippedValue,
        elementValue,
        locale,
        rawValue,
        newValue,
        type,
    }: FormatDecimalsInput
): string {
    const decimalEndRegExp = new RegExp(`${escape(decimal)}$`);
    const decimalRegExp = new RegExp(`${escape(decimal)}`);
    const isDecimal = decimalEndRegExp.test(newValue || elementValue);
    const hasDecimal = decimalRegExp.test(unformat(newValue || elementValue, { currency, locale, type }));
    const usedValue = isDecimal ? (newValue || strippedValue).slice(0, -1) : (newValue || strippedValue);
    const intValue = getFloat(usedValue, { currency, locale, type });
    const digits = intValue > 0
        ? getSignificantDigitCount(strippedValue, decimal) + 1
        : Math.min(4, hasDecimal ? strippedValue.length - 1 : strippedValue.length);

    if (Number.isNaN(intValue)) {
        return '';
    }

    const significantDigits = !/0$/.test(rawValue) ? undefined : digits;
    const formatted = formatter({ decimal, hasDecimal, input: intValue, isDecimal, significantDigits, strippedValue, suffix })
    return formatted;
}

export function getSignificantDigitCount(n: string | number, decimal: string): number {
    n = Math.abs(parseFloat(String(n).replace(decimal, '')));

    if (n === 0) {
        return 0;
    }

    while (n !== 0 && n % 10 === 0) {
        n /= 10;
    }

    return Math.floor(Math.log(n) / log10) + 1;
}

const formatPartsCache = {};

export function getFormatParts({ locale = 'en-US', currency = 'USD' }: GetFormatPartsOptions): StyleFormatParts {
    const key = `${locale}-${currency}`;
    if (formatPartsCache[key]) {
        return formatPartsCache[key];
    }

    const value = {
        currency: getStyleParts(locale, { currency, style: 'currency' }),
        number: getStyleParts(locale, { currency }),
        percent: getStyleParts(locale, { currency, minimumFractionDigits: 3, style: 'percent' }),
    };

    formatPartsCache[key] = value;
    return value;
}

const numberWithGroupAndDecimalSeparator = -10000.1;

function findLastIndex<T>(
    array: Array<T>,
    check: (value: T, index: number, obj: T[]) => boolean
): number {
    let index = array.length - 1;
    let value: number = null;
    for (; index >= 0; index--) {
        if (check(array[index], index, array)) {
            value = index;
            break;
        }
    }

    return value || -1;
}

function getStyleParts(locale: string, options): FormatParts {
    const parts = Intl.NumberFormat(locale, options).formatToParts(numberWithGroupAndDecimalSeparator);
    const prefixIndex = parts.findIndex((part) => part.type === 'integer');
    const suffixIndex = findLastIndex(parts, ({ type }) => ['decimal', 'integer', 'fraction'].includes(type));
    const combined = {
        parts,
        prefix: parts.slice(0, prefixIndex).map(({ value }) => value).join(''),
        suffix: parts.slice(suffixIndex + 1, parts.length).map(({ value }) => value).join(''),
    };
    let isBefore = true;

    return parts.reduce((collection, part, index) => {
        if (prefixIndex === index) {
            isBefore = false;
        }
        if (['currency', 'percentSign'].includes(part.type)) {
            collection.symbol = part.value;
            collection.position = isBefore ? 'beginning' : 'end';
            collection.minusPosition = isBefore ? 'beginning' : 'end';
        } else if (part.type !== 'integer') {
            collection[part.type] = part.value;
        }

        return collection;
    }, combined as Partial<FormatParts>) as FormatParts;
}

export function formatConstructor(
    { currency, formatOptions, locale }: Options
): (type: Format) => FormatFunction {
    const defaultOptions = {
        currency: {
            currency,
            maximumFractionDigits: 2,
            minimumFractionDigits: 0,
            style: 'currency',
            ...formatOptions,
        },
        number: {
            maximumFractionDigits: 3,
            style: 'decimal',
            ...formatOptions,
        },
        percent: {
            maximumFractionDigits: 3,
            style: 'percent',
            ...formatOptions,
        },
    };

    function trimInput({ callback, options, type, values } : TrimInputInput): string {
        const { maximumFractionDigits } = options;
        const { isDecimal, hasDecimal, decimal, suffix, strippedValue } = values;
        let { input } = values;
        const fractionDigits = getFractionDigits(input);

        if (fractionDigits >= maximumFractionDigits) {
            input = truncateFractionDigits(input, maximumFractionDigits);
        }

        let value = new Intl.NumberFormat(locale, options).format(callback ? callback(input) : input);

        if (suffix) {
            value = value.replace(new RegExp(`${escape(suffix)}$`), '');
        }

        const [, decimalPart] = unformat(value, { currency: options.currency, locale, type }).split(decimal);
        const [, strippedDecimalPart] = strippedValue.split('.');
        const intPart = value.substring(0, value.length - (decimalPart?.length ? decimalPart.length + 1 : 0));

        if (
            hasDecimal
            && !isDecimal
            && decimalPart !== strippedDecimalPart
        ) {
            value = [
                intPart,
                strippedDecimalPart?.substring(0, maximumFractionDigits),
            ].join(decimal);
        }

        return `${value}${isDecimal ? decimal : ''}`;
    }

    function handleDecimals(type: DecimalFormat, callback?: (input: number) => number): FormatFunction {
        return (values) => {
            return trimInput({ callback, options: defaultOptions[type], type, values });
        };
    }

    function handleInt(type: DecimalFormat, callback?: (input: number) => number) {
        return ({ input }) => {
            return new Intl.NumberFormat(locale, {
                ...defaultOptions[type],
                maximumFractionDigits: 0,
                minimumFractionDigits: 0,
            }).format(callback ? callback(input) : input);
        };
    }

    return (type: Format) => {
        const baseType = type === 'int' ? 'number' : type.replace(/int/i, '') as DecimalFormat;
        const callback = /percent/.test(type) ? (input) => input / 100 : null;

        return /int/i.test(type) ? handleInt(baseType, callback) : handleDecimals(baseType, callback);
    };
}

export function formatterConstructor({
    currency,
    formatOptions,
    locale,
}: {
    currency: string;
    formatOptions: Intl.NumberFormatOptions;
    locale: string;
}): Formatters {
    const formatParts = getFormatParts({ currency, locale });
    const formatObject = formatConstructor({ currency, formatOptions, locale });

    function getLabel({ isDecimalOnly, type, value, isNegativeOnly }): string {
        if (!value && !isNegativeOnly && !isDecimalOnly) {
            return '';
        }

        if (isNegativeOnly || isDecimalOnly) {
            const { decimal, prefix, suffix } = formatParts[type];
            return `${isNegativeOnly ? prefix : ''}${isDecimalOnly ? decimal : ''}${suffix}`;
        }

        if (formatParts[type].position === 'end') {
            const replacement = new RegExp(`${escape(formatParts[type].suffix)}$`);
            value = value.replace(replacement, '');
        }

        return value;
    }

    function format(type: DecimalFormat) {
        return (values) => {
            const { rawValue, deleted, elementValue, previousValue } = values;
            const signRegExp = new RegExp(`^${escape(formatParts[type].minusSign)}$`);
            const signSymbolRegExp = new RegExp(
                `^${escape(formatParts[type].minusSign)}\\${escape(formatParts[type].symbol)}$`
            );
            const isNegativeOnly = (signRegExp.test(elementValue) && !deleted)
                || signSymbolRegExp.test(elementValue)
                || (signRegExp.test(elementValue) && deleted && !signSymbolRegExp.test(previousValue));
            const decimalRegExp = new RegExp(`^${escape(formatParts[type].decimal)}$`);
            const isDecimalOnly = decimalRegExp.test(unformat(elementValue, { currency, locale, type }));
            const multiNegative = new RegExp(`${escape(formatParts[type].minusSign)}`, 'g');
            const isMultiNegative = rawValue?.match(multiNegative)?.length > 1;
            const chars = elementValue.split('');
            const minusPosition = chars.findIndex((char) => char === formatParts[type].minusSign);
            const intPosition = chars.findIndex((char) => !Number.isNaN(parseFloat(char)));
            const isBadNegative = formatParts[type].minusPosition === 'before'
                ? intPosition > 1 && minusPosition < intPosition
                : intPosition > 1 && minusPosition > intPosition;
            let value = formatDecimals({
                ...values,
                currency,
                formatParts: formatParts[type],
                formatter: formatObject(type),
                locale,
                type,
            });

            value = isBadNegative || isMultiNegative
                ? previousValue
                : value;

            return getLabel({ isDecimalOnly, isNegativeOnly, type, value });
        };
    }

    function formatInt(type: DecimalFormat) {
        return ({ deleted, rawValue, newValue, elementValue, previousValue }) => {
            const intValue = getInt(newValue || rawValue, { currency, locale, type });
            const signRegExp = new RegExp(`^${escape(formatParts[type].minusSign)}$`);
            const multiNegative = new RegExp(`${escape(formatParts[type].minusSign)}`, 'g');
            const chars = elementValue.split('');
            const minusPosition = chars.findIndex((char) => char === formatParts[type].minusSign);
            const isMultiNegative = rawValue?.match(multiNegative)?.length > 1;
            const intPosition = chars.findIndex((char) => !Number.isNaN(parseFloat(char)));
            const isBadNegative = formatParts[type].minusPosition === 'before'
                ? intPosition > 1 && minusPosition < intPosition
                : intPosition > 1 && minusPosition > intPosition;
            const signSymbolRegExp = new RegExp(`^${escape(formatParts[type].minusSign)}\\${escape(formatParts[type].symbol)}$`);
            const isNegativeOnly = (signRegExp.test(elementValue) && !deleted)
                || signSymbolRegExp.test(elementValue)
                || (signRegExp.test(elementValue) && deleted && !signSymbolRegExp.test(previousValue));

            const decimalRegExp = new RegExp(`^${escape(formatParts[type].decimal)}$`);
            const isDecimalOnly = decimalRegExp.test(elementValue);

            if (Number.isNaN(intValue) && !isNegativeOnly && !isBadNegative && !isMultiNegative) {
                return '';
            }

            const value = isBadNegative || isMultiNegative
                ? previousValue
                : formatObject(type === 'number' ? 'int' : `${type}Int`)({ input: intValue });

            return getLabel({ isDecimalOnly, isNegativeOnly, type, value });
        };
    }

    return FORMATS.reduce((collection, type) => {
        const baseType = type === 'int' ? 'number' : type.replace(/int/i, '') as DecimalFormat;
        collection[type] = {
            format: /int/i.test(type) ? formatInt(baseType) : format(baseType),
            prefix: formatParts[baseType].prefix,
            suffix: formatParts[baseType].suffix,
        };

        return collection;
    }, {}) as Formatters;
}

export function getInt(string: string, options: FormatPartsOptions = {}): number {
    return parseInt(unformat(string, options), 10);
}

export function getFloat(string: string, options: FormatPartsOptions = {}): number {
    return parseFloat(unformat(string, options));
}

export const styleMap: Record<Format, DecimalFormat> = {
    currency: 'currency',
    currencyInt: 'currency',
    int: 'number',
    number: 'number',
    percent: 'percent',
    percentInt: 'percent',
};

export function unformat(
    string: string | number,
    {
        currency = 'USD',
        locale = 'en-US',
        type = 'number',
    } :
    FormatPartsOptions = {}
): string {
    const { decimal, symbol } = getFormatParts({ currency, locale })[type];
    if (typeof string === 'string') {
        const symbolRegex = new RegExp(escape(symbol));
        string = string.replace(symbolRegex, '');
    }
    const strip = new RegExp(`[^\\d${escape(decimal)}-]`, 'g');
    return typeof string === 'string' ? string.replace(strip, '').replace(decimal, '.') : (string || '').toString();
}

export function escape(string = ''): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
