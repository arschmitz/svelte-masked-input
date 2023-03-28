import type { DecimalFormat, Format } from './constants';
import { BACKGROUND_STYLES, STYLES } from './constants';

export interface FormatParts {
    decimal: string;
    group: string;
    literal: string;
    parts: Intl.NumberFormatPart[];
    position?: string;
    prefix: string;
    suffix: string;
    symbol: string;
}

export type FormatStyles = 'currency' | 'percent' | 'number';

export type StyleFormatParts = Record<FormatStyles, FormatParts>;

export type FormatFunction = (input: Record<string, number>) => string;

export type BaseFormatObject = Record<Format, FormatFunction>;

export interface GetFormatPartsOptions {
    currency: string;
    locale: string;
}

export interface FormatInput {
    elementValue: string;
    newValue: string;
    rawValue: string;
    strippedValue: string;
}

export interface Formatter {
    format: (input: FormatInput) => string;
    pattern?: string;
    prefix?: string;
    suffix?: string;
}

export type Formatters = Record<Format, Formatter>;

type Options = {
    currency: string;
    formatOptions: Intl.NumberFormatOptions;
    locale: string;
};

interface FormatsObject extends BaseFormatObject {
    formatParts: StyleFormatParts;
}

interface FormatDecimalsInput {
    elementValue: string;
    formatParts: FormatParts;
    formatter: FormatFunction;
    newValue: string;
    rawValue: string;
    strippedValue: string;
    type: FormatStyles;
}

interface FormatPartsOptions {
    currency?: string;
    locale?: string;
    type?: FormatStyles;
}

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
        formatParts: { decimal, suffix },
        formatter,
        strippedValue,
        elementValue,
        rawValue,
        newValue,
    }: FormatDecimalsInput
): string {
    const decimalEndRegExp = new RegExp(`\\${decimal}$`);
    const decimalRegExp = new RegExp(`\\${decimal}`);
    const isDecimal = decimalEndRegExp.test(newValue || elementValue);
    const hasDecimal = decimalRegExp.test(newValue || elementValue);
    const usedValue = isDecimal ? (newValue || strippedValue).slice(0, -1) : (newValue || strippedValue);
    const intValue = parseFloat(usedValue.replace(decimal, '.'));
    const digits = intValue > 0
        ? getSignificantDigitCount(strippedValue, decimal) + 1
        : Math.min(4, hasDecimal ? strippedValue.length - 1 : strippedValue.length);

    if (Number.isNaN(intValue)) {
        return '';
    }

    const significantDigits = !/0$/.test(rawValue) ? undefined : digits;
    let value = formatter({ input: intValue, significantDigits });

    if (suffix) {
        value = value.replace(new RegExp(`${suffix}$`), '');
    }

    return `${value}${isDecimal ? decimal : ''}`;
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

    return parts.reduce((collection, part, index) => {
        if (['currency', 'percentSign'].includes(part.type)) {
            collection.symbol = part.value;
            collection.position = index === 0 ? 'beginning' : 'end';
        } else if (part.type !== 'integer') {
            collection[part.type] = part.value;
        }

        return collection;
    }, combined as Partial<FormatParts>) as FormatParts;
}

export function formatConstructor(
    { currency, formatOptions, locale }: Options
): FormatsObject {
    const formatParts = getFormatParts({ currency, locale });

    function trimInput({
        callback,
        input,
        options,
    }: {
        callback?: (number) => number;
        input: number;
        options: Intl.NumberFormatOptions;
    }): string {
        const { maximumFractionDigits } = options;
        const fractionDigits = getFractionDigits(input);

        if (fractionDigits >= maximumFractionDigits) {
            input = truncateFractionDigits(input, maximumFractionDigits);
        }

        if (maximumFractionDigits > fractionDigits && /0$/.test(input.toString())) {
            options.minimumFractionDigits = fractionDigits;
        }

        const formatter = new Intl.NumberFormat(locale, options);

        return formatter.format(callback ? callback(input) : input);
    }

    return {
        currency({ input }): string {
            return trimInput({
                input,
                options: {
                    currency,
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 0,
                    style: 'currency',
                    ...formatOptions,
                },
            });
        },
        currencyInt({ input }): string {
            const formatFunction = new Intl.NumberFormat(locale, {
                currency,
                maximumFractionDigits: 0,
                minimumFractionDigits: 0,
                style: 'currency',
                ...formatOptions,
            });

            return formatFunction.format(input as number);
        },
        formatParts,
        int({ input }): string {
            const formatFunction = new Intl.NumberFormat(locale, {
                maximumFractionDigits: 0,
                minimumFractionDigits: 0,
                style: 'decimal',
                ...formatOptions,
            });

            return formatFunction.format(input as number);
        },
        number({ input, significantDigits }): string {
            return trimInput({
                input,
                options: {
                    maximumFractionDigits: 3,
                    minimumSignificantDigits: significantDigits as number,
                    style: 'decimal',
                    ...formatOptions,
                },
            });
        },
        percent({ input, significantDigits }): string {
            return trimInput({
                callback: (_input) => _input / 100,
                input,
                options: {
                    maximumFractionDigits: 3,
                    minimumSignificantDigits: significantDigits as number,
                    style: 'percent',
                    ...formatOptions,
                },
            });
        },
        percentInt({ input }): string {
            const formatFunction = new Intl.NumberFormat(locale, {
                style: 'percent',
                ...formatOptions,
            });
            return formatFunction.format((input as number) / 100);
        },
    };
}

export function formatterConstructor({
    currency,
    formatObject,
    locale,
}: {
    currency: string;
    formatObject: FormatsObject;
    locale: string;
}): Formatters {
    const { formatParts } = formatObject;

    function getLabel(type: FormatStyles, value: string): string {
        if (!value) {
            return '';
        }

        if (formatParts[type].position === 'end') {
            const replacement = new RegExp(`${formatParts[type].suffix}$`);
            value = value.replace(replacement, '');
        }

        return value;
    }

    return {
        currency: {
            format(values): string {
                const value = formatDecimals({
                    ...values,
                    formatParts: formatParts.currency,
                    formatter: formatObject.currency,
                    type: 'currency',
                });

                return getLabel('currency', value);
            },
            pattern: '\\$\\d{1,3}(,\\d{3})*',
            prefix: formatParts.currency.prefix,
            suffix: formatParts.currency.suffix,
        },

        currencyInt: {
            format({ rawValue, newValue }): string {
                const intValue = getInt(newValue || rawValue, { currency, locale });

                if (Number.isNaN(intValue)) {
                    return '';
                }

                const value = formatObject.currencyInt({ input: intValue });

                return getLabel('currency', value);
            },
            pattern: '\\$\\d{1,3}(,\\d{3})*',
            prefix: formatParts.currency.prefix,
            suffix: formatParts.currency.suffix,
        },

        int: {
            format({ newValue, strippedValue }): string {
                const intValue = getInt(newValue || strippedValue);
                if (Number.isNaN(intValue)) {
                    return '';
                }

                return formatObject.int({ input: intValue });
            },
            pattern: '\\d{1,3}(,\\d{3})*',
            prefix: formatParts.number.prefix,
            suffix: formatParts.number.suffix,
        },

        number: {
            format(values): string {
                return formatDecimals({
                    ...values,
                    formatParts: formatParts.number,
                    formatter: formatObject.number,
                    type: 'number',
                });
            },
            pattern: '\\d{1,3}(,\\d{3})*(\\.\\d+)?$',
        },

        percent: {
            format(values): string {
                const value = formatDecimals({
                    ...values,
                    formatParts: formatParts.percent,
                    formatter: formatObject.percent,
                    type: 'percent',
                });
                return getLabel('percent', value);
            },
            pattern: '\\d*(\\.\\d+)?',
            prefix: formatParts.percent.prefix,
            suffix: formatParts.percent.suffix,
        },

        percentInt: {
            format({ newValue, strippedValue }): string {
                const intValue = getInt(newValue || strippedValue);
                if (Number.isNaN(intValue)) {
                    return '';
                }

                return getLabel('percent', formatObject.percentInt({ input: intValue }));
            },
            pattern: '\\d+',
            prefix: formatParts.percent.prefix,
            suffix: formatParts.percent.suffix,
        },
    };
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
    const { decimal } = getFormatParts({ currency, locale })[type];
    const strip = new RegExp(`[^\\d\\${decimal}-]`, 'g');
    return typeof string === 'string' ? string.replace(strip, '').replace(decimal, '.') : (string || '').toString();
}
