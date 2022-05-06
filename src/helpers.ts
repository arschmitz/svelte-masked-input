import type { Format } from './constants';
import { BACKGROUND_STYLES, STYLES } from './constants';

export interface Saperators {
    decimal: string;
    group: string;
}

export type FormatFunction = (input: Record<string, string | number>) => string;

type FormatsObject = Record<Format, FormatFunction>;

interface FormatDecimalsInput {
    elementValue: string;
    formatter: FormatFunction;
    newValue: string;
    rawValue: string;
    separators: Saperators;
    strippedValue: string;
}

interface FormatInput {
    elementValue: string;
    newValue: string;
    rawValue: string;
    separators: Saperators;
    strippedValue: string;
}

export interface Formatter {
    format: (input: FormatInput) => string;
    pattern?: string;
    prefix?: string;
    suffix?: string;
}

export type Formatters = Record<Format, Formatter>;

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

export function getSeparators(locale: string): Saperators {
    const numberWithGroupAndDecimalSeparator = 1000.1;
    return Intl.NumberFormat(locale)
        .formatToParts(numberWithGroupAndDecimalSeparator)
        .reduce((collection, part) => {
            if (part.type === 'decimal' || part.type === 'group') {
                collection[part.type] = part.value;
            }

            return collection;
        }, {}) as Saperators;
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

export function getCurrencySymbol(currency: string): string {
    const symbol = new Intl.NumberFormat('en', { currency, style: 'currency' })
        .formatToParts(1)
        .find((x) => x.type === 'currency');
    return symbol && symbol.value;
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

export function formatConstructor(
    { currency, formatOptions, locale }:
    { currency: string; formatOptions: Record<string, unknown>; locale: string; }
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

            if (getFractionDigits(input) >= maximumFractionDigits) {
                input = truncateFractionDigits(input, maximumFractionDigits);
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

            if (getFractionDigits(input) >= maximumFractionDigits) {
                input = truncateFractionDigits(input, maximumFractionDigits);
            }

            const formatFunction = new Intl.NumberFormat(locale, options);

            return formatFunction.format(input as number);
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
                return formatDecimals({ ...values, formatter: formatObject.currency });
            },
            pattern: '\\$\\d{1,3}(,\\d{3})*',
            prefix: '$',
        },

        currencyInt: {
            format({ rawValue, newValue }): string {
                const intValue = getInt(newValue || rawValue);

                if (Number.isNaN(intValue)) {
                    return '';
                }

                return formatObject.currencyInt({ input: intValue });
            },
            pattern: '\\$\\d{1,3}(,\\d{3})*',
            prefix: '$',
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

                const newValue = formatDecimals({ ...values, formatter: formatObject.number, strippedValue });
                return newValue;
            },
            pattern: '\\d*(\\.\\d+)?',
            suffix: '%',
        },

        percentInt: {
            format({ newValue, strippedValue }): string {
                const intValue = getInt(newValue || strippedValue);
                if (Number.isNaN(intValue)) {
                    return '';
                }

                return `${formatObject.int({ input: intValue })}`;
            },
            pattern: '\\d+',
            suffix: '%',
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
