import type { Format } from './constants';
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

export type FormatFunction = (input: Record<string, string | number>) => string;

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
    decimal: string;
    elementValue: string;
    formatter: FormatFunction;
    newValue: string;
    rawValue: string;
    strippedValue: string;
}

function getFractionDigits(number, separator) {
    return String(number).split(separator)[1]?.length;
}

function truncateFractionDigits(number, digits, separator) {
    const [int, decimal] = `${number}`.split(separator);

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
    { decimal, formatter, strippedValue, elementValue, rawValue, newValue }: FormatDecimalsInput
): string {
    const decimalEndRegExp = new RegExp(`\\${decimal}$`);
    const decimalRegExp = new RegExp(`\\${decimal}`);
    const isDecimal = decimalEndRegExp.test(newValue || elementValue);
    const hasDecimal = decimalRegExp.test(newValue || elementValue);
    const usedValue = isDecimal ? (newValue || strippedValue).slice(0, -1) : (newValue || strippedValue);
    const intValue = parseFloat(usedValue);
    const digits = intValue > 0
        ? getSignificantDigitCount(strippedValue, decimal) + 1
        : Math.min(4, hasDecimal ? strippedValue.length - 1 : strippedValue.length);

    if (Number.isNaN(intValue)) {
        return '';
    }

    const significantDigits = !/0$/.test(rawValue) ? undefined : digits;

    return `${formatter({ input: intValue, significantDigits })}${isDecimal ? decimal : ''}`;
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

export function getFormatParts({ locale = 'en-US', currency = 'USD' }: GetFormatPartsOptions): StyleFormatParts {
    return {
        currency: getStyleParts(locale, { currency, style: 'currency' }),
        number: getStyleParts(locale, { currency }),
        percent: getStyleParts(locale, { currency, style: 'percent' }),
    };
}

const numberWithGroupAndDecimalSeparator = 10000.1;

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
    const suffixIndex = findLastIndex(parts, ({ type }) => ['decimal', 'integer'].includes(type));
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

    function trimInput({ input, type, options }): number {
        const { maximumFractionDigits } = options;
        const { decimal } = formatParts[type];

        if (getFractionDigits(input, decimal) >= maximumFractionDigits) {
            input = truncateFractionDigits(input, maximumFractionDigits, decimal);
        }

        return input;
    }

    return {
        currency({ input }): string {
            const options = {
                currency,
                maximumFractionDigits: 2,
                minimumFractionDigits: 0,
                style: 'currency',
                ...formatOptions,
            };

            input = trimInput({ input, options, type: 'currency' });

            return new Intl.NumberFormat(locale, options).format(input as number);
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
            const options = {
                maximumFractionDigits: 3,
                minimumSignificantDigits: significantDigits as number,
                style: 'decimal',
                ...formatOptions,
            };

            input = trimInput({ input, options, type: 'number' });

            return new Intl.NumberFormat(locale, options).format(input as number);
        },
        percent({ input }): string {
            const options = {
                maximumFractionDigits: 3,
                style: 'percent',
                ...formatOptions,
            };

            input = trimInput({ input, options, type: 'percent' });

            return new Intl.NumberFormat(locale, options).format((input as number) / 100);
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

export function formatterConstructor(formatObject: FormatsObject): Formatters {
    const { formatParts } = formatObject;

    function getLabel(type: FormatStyles, value: string): string {
        if (!value) {
            return ' ';
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
                    decimal: formatParts.currency.decimal,
                    formatter: formatObject.currency,
                });

                return getLabel('currency', value);
            },
            pattern: '\\$\\d{1,3}(,\\d{3})*',
            prefix: formatParts.currency.prefix,
            suffix: formatParts.currency.suffix,
        },

        currencyInt: {
            format({ rawValue, newValue }): string {
                const intValue = getInt(newValue || rawValue);

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
                    decimal: formatParts.number.decimal,
                    formatter: formatObject.number,
                });
            },
            pattern: '\\d{1,3}(,\\d{3})*(\\.\\d+)?$',
        },

        percent: {
            format({ strippedValue, ...values }): string {
                const numberValue = parseFloat(strippedValue);
                if (Number.isNaN(numberValue)) {
                    return '';
                }

                const value = formatDecimals({
                    ...values,
                    decimal: formatParts.percent.decimal,
                    formatter: formatObject.number,
                    strippedValue,
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

export function getInt(string: string): number {
    return parseInt(unformat(string), 10);
}

export function getFloat(string: string): number {
    return parseFloat(unformat(string));
}

export function unformat(string: string | number): string {
    return typeof string === 'string' ? string.replace(/[^\d.-]/g, '') : (string || '').toString();
}
