import type { Format } from './constants';
import { BACKGROUND_STYLES, STYLES } from './constants';

export interface Separators {
    decimal: string;
    group: string;
    integer: number;
    literal: string;
    position?: string;
    symbol: string;
}

export type FormatFunction = (input: Record<string, string | number>) => string;

type Options = { currency: string; formatOptions: Intl.NumberFormatOptions; locale: string; };

type BaseFormatObject = Record<Format, FormatFunction>;

interface FormatsObject extends BaseFormatObject {
    options: Options;
}

interface FormatDecimalsInput {
    elementValue: string;
    formatter: FormatFunction;
    newValue: string;
    rawValue: string;
    separators: Separators;
    strippedValue: string;
}

interface FormatInput {
    elementValue: string;
    newValue: string;
    rawValue: string;
    separators: Separators;
    strippedValue: string;
}

export interface Formatter {
    format: (input: FormatInput) => string;
    pattern?: string;
    prefix?: string;
    suffix?: string;
}

export type Formatters = Record<Format, Formatter>;

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

export function getSeparators(locale: string, currency: string): Record<'currency' | 'percent' | 'number', Separators> {
    return {
        currency: getParts(locale, { currency, style: 'currency' }),
        number: getParts(locale, { currency }),
        percent: getParts(locale, { currency, style: 'percent' }),
    };
}

function getParts(locale: string, options): Separators {
    const numberWithGroupAndDecimalSeparator = 10000.1;
    const parts = Intl.NumberFormat(locale, options).formatToParts(numberWithGroupAndDecimalSeparator);
    return parts.reduce((collection, part, index) => {
        if (['currency', 'percentSign'].includes(part.type)) {
            collection.symbol = part.value;
            collection.position = index === 0 ? 'beginning' : 'end';
        } else if (part.type !== 'integer') {
            collection[part.type] = part.value;
        }

        return collection;
    }, {} as Partial<Separators>) as Separators;
}

const log10 = Math.log(10);

export function formatDecimals(
    { formatter, strippedValue, elementValue, rawValue, separators, newValue }: FormatDecimalsInput
): string {
    const decimalEndRegExp = new RegExp(`\\${separators.decimal}$`);
    const decimalRegExp = new RegExp(`\\${separators.decimal}`);
    const isDecimal = decimalEndRegExp.test(newValue || elementValue);
    const hasDecimal = decimalRegExp.test(newValue || elementValue);
    const usedValue = isDecimal ? (newValue || strippedValue).slice(0, -1) : (newValue || strippedValue);
    const intValue = parseFloat(usedValue);
    const digits = intValue > 0
        ? getSignificantDigitCount(strippedValue, separators.decimal) + 1
        : Math.min(4, hasDecimal ? strippedValue.length - 1 : strippedValue.length);

    if (Number.isNaN(intValue)) {
        return '';
    }

    const significantDigits = !/0$/.test(rawValue) ? undefined : digits;

    return `${formatter({ input: intValue, significantDigits })}${isDecimal ? separators.decimal : ''}`;
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

function getFix(type, formatObject: FormatsObject, position) {
    const { currency, locale } = formatObject.options;
    const separators = getSeparators(locale, currency)[type];
    const { symbol } = separators;

    if (separators.position === 'begining' && position === 'prefix') {
        return `${symbol}${separators.literal || ''}`;
    }

    if (separators.position === 'end' && position === 'suffix') {
        return `${separators.literal || ''}${symbol}`;
    }

    return '';
}

function getLabel(type, formatObject: FormatsObject, value: string): string {
    if (!value) {
        return ' ';
    }
    const { currency, locale } = formatObject.options;
    const separators = getSeparators(locale, currency)[type];

    if (separators.position === 'end') {
        value = value.replace(separators.symbol, '');

        if (separators.literal) {
            value = value.replace(new RegExp(`${separators.literal}$`), '');
        }
    }

    return value;
}

export function formatConstructor(
    { currency, formatOptions, locale }: Options
): FormatsObject {
    return {
        currency({ input }): string {
            const options = {
                currency,
                maximumFractionDigits: 2,
                minimumFractionDigits: 0,
                style: 'currency',
                ...formatOptions,
            };

            const { maximumFractionDigits } = options;
            console.log('currency', currency);
            const separators = getSeparators(locale, currency).currency;

            if (getFractionDigits(input, separators.decimal) >= maximumFractionDigits) {
                input = truncateFractionDigits(input, maximumFractionDigits, separators.decimal);
            }

            const formatFunction = new Intl.NumberFormat(locale, options);

            return formatFunction.format(input as number);
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

            const { maximumFractionDigits } = options;
            console.log('number', currency);
            const separators = getSeparators(locale, currency).number;

            if (getFractionDigits(input, separators.decimal) >= maximumFractionDigits) {
                input = truncateFractionDigits(input, maximumFractionDigits, separators.decimal);
            }

            const formatFunction = new Intl.NumberFormat(locale, options);

            return formatFunction.format(input as number);
        },
        options: {
            currency,
            formatOptions,
            locale,
        },
        percent({ input }): string {
            const formatFunction = new Intl.NumberFormat(locale, {
                maximumFractionDigits: 3,
                style: 'percent',
                ...formatOptions,
            });

            return formatFunction.format((input as number) / 100);
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
    return {
        currency: {
            format(values): string {
                const value = formatDecimals({ ...values, formatter: formatObject.currency });

                return getLabel('currency', formatObject, value);
            },
            pattern: '\\$\\d{1,3}(,\\d{3})*',
            prefix: getFix('currency', formatObject, 'prefix'),
            suffix: getFix('currency', formatObject, 'suffix'),
        },

        currencyInt: {
            format({ rawValue, newValue }): string {
                const intValue = getInt(newValue || rawValue);

                if (Number.isNaN(intValue)) {
                    return '';
                }

                const value = formatObject.currencyInt({ input: intValue });

                return getLabel('currency', formatObject, value);
            },
            pattern: '\\$\\d{1,3}(,\\d{3})*',
            prefix: getFix('currency', formatObject, 'prefix'),
            suffix: getFix('currency', formatObject, 'suffix'),
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
        },

        number: {
            format(values): string {
                return formatDecimals({ ...values, formatter: formatObject.number });
            },
            pattern: '\\d{1,3}(,\\d{3})*(\\.\\d+)?$',
        },

        percent: {
            format({ strippedValue, ...values }): string {
                const numberValue = parseFloat(strippedValue);
                if (Number.isNaN(numberValue)) {
                    return '';
                }

                const value = formatDecimals({ ...values, formatter: formatObject.number, strippedValue });
                return getLabel('percent', formatObject, value);
            },
            pattern: '\\d*(\\.\\d+)?',
            prefix: getFix('percent', formatObject, 'prefix'),
            suffix: getFix('percent', formatObject, 'suffix'),
        },

        percentInt: {
            format({ newValue, strippedValue }): string {
                const intValue = getInt(newValue || strippedValue);
                if (Number.isNaN(intValue)) {
                    return '';
                }

                return getLabel(
                    'percent',
                    formatObject,
                    formatObject.percentInt({ input: intValue })
                );
            },
            pattern: '\\d+',
            prefix: getFix('percent', formatObject, 'prefix'),
            suffix: getFix('percent', formatObject, 'suffix'),
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
