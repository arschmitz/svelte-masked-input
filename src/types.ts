import type { Format } from './constants';

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

interface FormatFunctionInput {
    decimal?: string;
    hasDecimal?: boolean;
    input: number;
    isDecimal?: boolean;
    significantDigits?: number;
    strippedValue?: string;
    suffix?: string;
}

export type FormatFunction = (input: FormatFunctionInput) => string;

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

export type Options = {
    currency: string;
    formatOptions: Intl.NumberFormatOptions;
    locale: string;
};

export interface FormatsObject extends BaseFormatObject {
    formatParts: StyleFormatParts;
}

export interface FormatDecimalsInput {
    elementValue: string;
    formatParts: FormatParts;
    formatter: FormatFunction;
    newValue: string;
    rawValue: string;
    strippedValue: string;
    type: FormatStyles;
}

export interface FormatPartsOptions {
    currency?: string;
    locale?: string;
    type?: FormatStyles;
}

export interface TrimInputInput {
    callback?: (input: number) => number;
    options: Intl.NumberFormatOptions;
    values: FormatFunctionInput;
}

export interface InteractiveFormatterOptions {
    currency: string;
    formatOptions: Intl.NumberFormatOptions;
    locale: string;
    type: Format;
}
