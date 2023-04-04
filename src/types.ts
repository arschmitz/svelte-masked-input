import type { DecimalFormat } from './constants';

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

export type StyleFormatParts = Record<DecimalFormat, FormatParts>;

export interface GetFormatPartsOptions {
    currency: string;
    locale: string;
}

export type Options = {
    currency: string;
    formatOptions: Intl.NumberFormatOptions;
    locale: string;
};
