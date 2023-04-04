import type {
    FormatParts,
    GetFormatPartsOptions,
    StyleFormatParts
} from './types';
import {
    BACKGROUND_STYLES,
    STYLES
} from './constants';

export function getFractionDigits(number: number): number {
    return String(number).split('.')[1]?.length;
}

export function truncateFractionDigits(number: number, digits: number): number {
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

const formatPartsCache = {};

export function getFormatParts({ locale = 'en-US', currency = 'USD' }: GetFormatPartsOptions): StyleFormatParts {
    const key = `${locale}-${currency}`;
    if (formatPartsCache[key]) {
        return formatPartsCache[key];
    }

    const value = {
        currency: getStyleParts(locale, { currency, style: 'currency' }),
        decimal: getStyleParts(locale, { currency }),
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
