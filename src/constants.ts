export const BACKGROUND_STYLES = [
    'background-attachment',
    'background-blend-mode',
    'background-clip',
    'background-color',
    'background-image',
    'background-origin',
    'background-position',
    'background-repeat',
    'background-size',
];

export const STYLES = [
    'border-block-end-width',
    'border-block-start-width',
    'border-bottom-left-radius',
    'border-bottom-right-radius',
    'border-bottom-width',
    'border-collapse',
    'border-end-end-radius',
    'border-end-start-radius',
    'border-inline-end-width',
    'border-inline-start-width',
    'border-left-width',
    'border-right-width',
    'border-start-end-radius',
    'border-start-start-radius',
    'border-top-left-radius',
    'border-top-right-radius',
    'border-top-width',
    'font-family',
    'font-kerning',
    'font-optical-sizing',
    'font-size',
    'font-stretch',
    'font-style',
    'font-synthesis-small-caps',
    'font-synthesis-style',
    'font-synthesis-weight',
    'font-variant',
    'font-variant-caps',
    'font-variant-east-asian',
    'font-variant-ligatures',
    'font-variant-numeric',
    'font-weight',
    'letter-spacing',
    'line-height',
    'margin-bottom',
    'margin-left',
    'margin-right',
    'margin-top',
    'padding-block-end',
    'padding-block-start',
    'padding-bottom',
    'padding-inline-end',
    'padding-inline-start',
    'padding-left',
    'padding-right',
    'padding-top',
    'text-align',
    'text-align-last',
    'text-anchor',
    'text-decoration',
    'text-decoration-color',
    'text-decoration-line',
    'text-decoration-skip-ink',
    'text-decoration-style',
    'text-indent',
    'text-overflow',
    'text-rendering',
    'text-shadow',
    'text-size-adjust',
    'text-transform',
    'text-underline-position',
    'transform',
    'transform-origin',
    'transform-style',
    'word-spacing',
    'zoom',
];

export const EVENTS = [
    'pointerover',
    'pointerout',
    'focus',
    'blur',
];

export const INTEGER_FORMATS = ['currencyInt', 'int', 'percentInt'] as const;
type IntFormatTuple = typeof INTEGER_FORMATS;
export type IntFormat = IntFormatTuple[number];

export const DECIMAL_FORMATS = ['currency', 'number', 'percent'] as const;
type DecimalFormatTuple = typeof DECIMAL_FORMATS;
export type DecimalFormat = DecimalFormatTuple[number];

export const FORMATS = [...INTEGER_FORMATS, ...DECIMAL_FORMATS] as const;
type FormatTuple = typeof FORMATS;
export type Format = FormatTuple[number];
