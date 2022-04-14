<script lang="ts">
    import { afterUpdate, onDestroy, onMount } from "svelte";
    // setting value to a space when empty causes incorrect validation error

    export let currency = 'USD';
    export let format = '';
    export let formatOptions: Record<string, number | string> = null;
    export let formatter = null;
    export let inputElement: HTMLInputElement = null;
    export let locale = 'en-us';
    export let pattern = '';
    export let placeholder = '';
    export let polling = false;
    export let prefix = '';
    export let required = false;
    export let value = '';
    export let strippedValue = '';

    let _class = '';
    export { _class as class };

    const log10 = Math.log(10);
    const backgroundStyles = [
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
    const copiedStyles = [
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
        'zoom'
    ];
    const events = [
        'pointerover',
        'pointerout',
        'focus',
        'blur',
        'input',
    ];

    let currentPattern = null;
    let remainingMask = prefix ? placeholder.replace(prefix, '') : placeholder;
    let significantDigits = 1;
    let decimalRegExp: RegExp = null;
    let decimalEndRegExp: RegExp = null;
    let seperators: Record<string, string> = {};
    let mask: HTMLSpanElement;
    let poll: number;
    let styles: CSSStyleDeclaration;

    console.log(typeof value, value)
    strippedValue = value?.replace(/[^\d.-]/g, '') || '';

    function getSeperators(_) {
        const numberWithGroupAndDecimalSeparator = 1000.1;
        return Intl.NumberFormat(locale)
            .formatToParts(numberWithGroupAndDecimalSeparator)
            .reduce((collection, part) => {
                if (part.type === 'decimal' || part.type === 'group') {
                    collection[part.type] = part.value;
                }

                return collection;
            }, {});
    }

    $: seperators = getSeperators(locale);
    $: decimalEndRegExp = new RegExp(`\\${seperators.decimal}$`);
    $: decimalRegExp = new RegExp(`\\${seperators.decimal}`);
    $: placeholderDecimal = placeholder?.split(seperators.decimal)[1] || '';
    $: placeholderDecimalLength = placeholderDecimal?.length;

    function getSignificantDigitCount(n) {
        n = Math.abs(parseFloat(String(n).replace(seperators.decimal, '')));

        if (n === 0) {
            return 0;
        }

        while (n !== 0 && n % 10 === 0) {
            n /= 10;
        }

        return Math.floor(Math.log(n) / log10) + 1;
    }

    function getFractionDigits(number) {
        return String(number).split('.')[1]?.length
    }

    function truncateFractionDigits(number, digits) {
        let [int, decimal] = `${number}`.split('.');

        return parseFloat(`${int}.${decimal.substring(0, digits)}`);
    }

    const formats = {
        currency(input): string {
            const options = formatOptions || {
                currency,
                maximumFractionDigits: 2,
                minimumFractionDigits: 0,
                style: 'currency',
            }

            const maximumFractionDigits = options.maximumFractionDigits;

            if (getFractionDigits(input) >= maximumFractionDigits) {
                input = truncateFractionDigits(input, maximumFractionDigits);
            }

            const formatFunction = new Intl.NumberFormat(locale, options);

            return formatFunction.format(input);
        },
        currencyInt(input): string {
            const formatFunction = new Intl.NumberFormat(locale, formatOptions || {
                currency,
                maximumFractionDigits: 0,
                minimumFractionDigits: 0,
                style: 'currency',
            });

            return formatFunction.format(input);
        },
        int(input): string {
            const formatFunction = new Intl.NumberFormat(locale, formatOptions || {
                maximumFractionDigits: 0,
                minimumFractionDigits: 0,
                style: 'decimal',
            });

            return formatFunction.format(input);
        },
        number(input: number): string {
            const options = formatOptions || {
                maximumFractionDigits: 3,
                minimumSignificantDigits: significantDigits,
                style: 'decimal',
            }

            const maximumFractionDigits = options.maximumFractionDigits;

            if (getFractionDigits(input) >= maximumFractionDigits) {
                input = truncateFractionDigits(input, maximumFractionDigits);
            }

            const formatFunction = new Intl.NumberFormat(locale, options);

            return formatFunction.format(input);
        },
        percent(input: number): string {
            const formatFunction = new Intl.NumberFormat(locale, formatOptions || {
                maximumFractionDigits: 3,
                style: 'percent',
            });

            return formatFunction.format(input / 100);
        },
        percentInt(input: number): string {
            const formatFunction = new Intl.NumberFormat(locale, formatOptions || {
                style: 'percent',
            });
            return formatFunction.format(input / 100);
        },
    };

    function formatDecimals(currentFormatter, suffix = '') {
        const isDecimal = decimalEndRegExp.test(inputElement.value);
        const hasDecimal = decimalRegExp.test(inputElement.value);
        const usedValue = isDecimal ? strippedValue.slice(0, -1) : strippedValue;
        const intValue = parseFloat(usedValue);
        const digits = intValue > 0
            ? getSignificantDigitCount(strippedValue) + 1
            : Math.min(4, hasDecimal ? strippedValue.length - 1 : strippedValue.length);

        if (Number.isNaN(intValue)) {
            remainingMask = placeholder + suffix;
            return ' ';
        }

        remainingMask = `${isDecimal || suffix ? '' : seperators.decimal}${placeholderDecimal || ''}`;
        significantDigits = !/0$/.test(rawValue) ? undefined : digits;

        if (hasDecimal && !isDecimal) {
            const decimalLength = rawValue.split(seperators.decimal)[1].length;
            const remainingDecimals = placeholderDecimalLength - decimalLength;

            remainingMask = `${remainingDecimals > 0 ? placeholderDecimal.slice(-1 * decimalLength) : ''}`;
        }

        return `${currentFormatter(intValue)}${isDecimal ? seperators.decimal : ''}`;
    }

    function setRemainingMask(suffix = '') {
        if (!rawValue) {
            remainingMask = ` ${placeholder}`;
        }

        const remainingMaskLength = placeholder.length - rawValue.length;
        if (remainingMaskLength <= 0) {
            remainingMask = ' ';
        } else {
            remainingMask = placeholder.slice(-1 * remainingMaskLength);
        }

        if (remainingMask && suffix) {
            remainingMask += suffix;
        }
    }

    const formatters = {
        currency: {
            format() {
                return formatDecimals(formats.currency);
            },
            pattern: '\\$\\d{1,3}(,\\d{3})*',
            prefix: '$',
        },

        currencyInt: {
            format({ updateMask = true, newValue } = { updateMask: true, newValue: null }) {
                let intValue;
                intValue = parseInt((newValue || rawValue)?.replace(/[^\d.-]/g, '') || '', 10);

                if (updateMask) {
                    setRemainingMask();
                }

                if (Number.isNaN(intValue)) {
                    return ' ';
                }


                return formats.currencyInt(intValue);
            },
            pattern: '\\$\\d{1,3}(,\\d{3})*',
            prefix: '$',
        },

        int: {
            format() {
                const intValue = parseInt(strippedValue, 10);
                if (Number.isNaN(intValue)) {
                    return ' ';
                }

                setRemainingMask();
                return formats.int(intValue);
            },
            pattern: '\\d{1,3}(,\\d{3})*',
        },

        number: {
            format() {
                return formatDecimals(formats.number);
            },
            pattern: '\\d{1,3}(,\\d{3})*(\\.\\d+)?$',
        },

        percent: {
            format() {
                const numberValue = parseFloat(strippedValue);
                if (Number.isNaN(numberValue)) {
                    return ' ';
                }

                const newValue = formatDecimals(formats.number);
                remainingMask = new Array(strippedValue.length - 1).fill(' ').join('');
                return newValue;
            },
            suffix: '%',
            pattern: '\\d*(\\.\\d+)?',
        },

        percentInt: {
            format() {
                const intValue = parseInt(strippedValue, 10);
                if (Number.isNaN(intValue)) {
                    return ' ';
                }

                setRemainingMask('%');
                return `${formats.int(intValue)}`;
            },
            suffix: '%',
            pattern: '\\d+',
        },
    };

    $: formatter = formatters[format];
    $: prefix = format ? (formatters[format].prefix || '') : (prefix || '');
    $: suffix = format ? (formatters[format].suffix || '') : (suffix || '');
    $: usedPattern = required || strippedValue ? (format ? pattern || formatters[format].pattern : pattern) : null;
    $: usedPlaceholder = format ? formats[format].placeholder : null;

    let rawValue = formatters[format].prefix && !strippedValue ? ' ' : strippedValue;
    $: hiddenValue = prefix && rawValue === ' ' ? '' : rawValue;

    $: updateValue(value);

    function updateValue(_) {
        setTimeout(() => {
            if (value === undefined) {
                inputElement.value = '';
                update();
                return;
            }


            const newRaw = formatters[format].format({ updateMask: false, newValue: value });
            console.log(newRaw, rawValue, value)
            if (newRaw && newRaw !== rawValue) {
                inputElement.value = value;
                update();
            }
        });
    }

    function update({ newValue } = { newValue: null }) {
        const cursorPosBefore = inputElement.selectionStart;
        const originalLength = rawValue.length;

        strippedValue = newValue !== undefined && newValue !== null ?  newValue : inputElement.value.replace(/[^\d.-]/g, '');
        currentPattern = null;

        rawValue = formatters[format].format();

        currentPattern = usedPattern;
        const changeLength = rawValue.length - originalLength;

        value = rawValue

        if (changeLength !== 1) {
            setTimeout(() => {
                inputElement.selectionStart = cursorPosBefore;
                inputElement.selectionEnd = cursorPosBefore;
            })
        } else {
            setTimeout(() => {
                inputElement.selectionStart = cursorPosBefore + 1;
                inputElement.selectionEnd = cursorPosBefore + 1;
            })
        }
    }

    function _update(this: HTMLInputElement) {
        return update();
    }

    function updateMaskStyle() {
        setTimeout(() => {
            if (!mask.isConnected) {
                return;
            }

            const changes = {};

            copiedStyles.forEach((prop) => {
                if (mask.style[prop] !== styles[prop]) {
                    changes[prop] = styles[prop]
                }
            });

            ['top', 'left', 'width', 'height'].forEach((dimension) => {
                const prop = `offset${dimension.charAt(0).toUpperCase() + dimension.slice(1)}`;
                if (mask.style[dimension] !== `${inputElement[prop]}px`) {
                    changes[dimension] = `${inputElement[prop]}px`;
                }
            });

            if (!Object.keys(changes).length) {
                return;
            }

            Object.assign(mask.style, changes);

            inputElement.style.background = 'none';
        });
    }

    onMount(() => {
        styles = getComputedStyle(inputElement);

        Object.assign(
            mask.style,
            backgroundStyles.reduce((copied, prop) => {
                copied[prop] = styles[prop];
                return copied;
            }, {}),
        );

        if (polling) {
            poll = window.setInterval(updateMaskStyle, 200);
        }

        events.forEach((event) => {
            inputElement.addEventListener(event, updateMaskStyle);
        });

        inputElement.addEventListener('input', _update);

        document.fonts.ready.then(updateMaskStyle);

        update();
    });

    afterUpdate(() => {
        if (!polling) {
            updateMaskStyle();
        }
    });

    onDestroy(() => {
        if (poll) {
            clearInterval(poll);
        }

        events.forEach((event) => {
            inputElement?.removeEventListener(event, updateMaskStyle);
        });

        inputElement?.removeEventListener('input', _update);
    });
</script>

<style lang="scss">
    .formatted-input-mask {
        position: absolute;
        color: #ccc;
        pointer-events: none;
        box-sizing: border-box;
        border-style: solid;
        border-color: transparent;
        display: inline-flex;
        z-index: -1;
    }

    i {
        font-style: normal;
        color: transparent;
        opacity: 0;
        visibility: hidden;
    }

    input {
        font-family: monospace;
        text-transform: uppercase;
        box-sizing: border-box;
    }

    .suffix {
        color: initial;
    }
</style>

<span
    aria-hidden="true"
    class="formatted-input-mask"
    bind:this={mask}
>
    {strippedValue && strippedValue.length ? '' : prefix}<i>{hiddenValue}</i>{remainingMask ||
''}<span class="suffix">{suffix}</span>
</span>
<input
    bind:this={inputElement}
    bind:value={rawValue}
    class={_class}
    on:blur
    on:change
    on:focus
    on:input
    on:keydown
    placeholder={usedPlaceholder}
    {...$$restProps}
/>
