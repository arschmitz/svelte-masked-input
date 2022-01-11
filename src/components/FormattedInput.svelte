<script lang="typescript">
    export let placeholder = '';
    export let value = '';
    export let pattern = '';
    export let format = '';
    export let prefix = '';
    export let required = false;
    export let formatter = null;
    export let locale = 'en-us';
    export let currency = 'USD';
    export let formatOptions: Record<string, number | string> = null;

    let rawValue = '';
    let inputElement: HTMLInputElement;
    let currentPattern = null;
    let remainingMask = placeholder;
    let significantDigits = 1;
    let decimalRegExp: RegExp = null;
    let decimalEndRegExp: RegExp = null;
    let seperators: Record<string, string> = {};

    const log10 = Math.log(10);

    function getSeperators(_) {
        const numberWithGroupAndDecimalSeparator = 1000.1;
        return Intl.NumberFormat(locale)
            .formatToParts(numberWithGroupAndDecimalSeparator)
            .reduce((collection, part) => {
                if (part.type === 'decimal' || part.type === 'group') {
                    colle ction[part.type] = part.value;
                }

                return collection;
            }, {});
    }

    $: seperators = getSeperators(locale);

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

    const formats = {
        currency(input): string {
            const formatFunction = new Intl.NumberFormat(locale, {
                currency,
                maximumFractionDigits: 2,
                minimumFractionDigits: 0,
                style: 'currency',
            });

            return formatFunction.format(input);
        },
        currencyInt(input): string {
            const formatFunction = new Intl.NumberFormat(locale, {
                currency,
                maximumFractionDigits: 0,
                minimumFractionDigits: 0,
                style: 'currency',
            });

            return formatFunction.format(input);
        },
        int(input): string {
            const formatFunction = new Intl.NumberFormat(locale, {
                maximumFractionDigits: 0,
                minimumFractionDigits: 0,
                style: 'decimal',
            });

            return formatFunction.format(input);
        },
        number(input: number): string {
            const formatFunction = new Intl.NumberFormat(locale, {
                minimumSignificantDigits: significantDigits,
                style: 'decimal',
            });

            return formatFunction.format(input);
        },
        percent(input: number): string {
            const formatFunction = new Intl.NumberFormat(locale, {
                maximumFractionDigits: 0,
                style: 'percent',
            });

            return formatFunction.format(input);
        },
        percentInt(input: number): string {
            const formatFunction = new Intl.NumberFormat(locale, formatOptions || {
                style: 'percent',
            });
            return formatFunction.format(input);
        },
    };

    function formatDecimals(currentFormatter) {
        const isDecimal = decimalEndRegExp.test(inputElement.value);
        const hasDecimal = decimalRegExp.test(inputElement.value);
        const usedValue = isDecimal ? value.slice(0, -1) : value;
        const intValue = parseFloat(usedValue);
        const digits = intValue > 0
            ? getSignificantDigitCount(value) + 1
            : Math.min(4, hasDecimal ? value.length - 1 : value.length);

        if (Number.isNaN(intValue)) {
            remainingMask = placeholder;
            return '';
        }

        remainingMask = `${isDecimal ? '' : seperators.decimal}${placeholderDecimal}`;
        significantDigits = !/0$/.test(rawValue) ? undefined : digits;

        if (hasDecimal && !isDecimal) {
            const decimalLength = rawValue.split(seperators.decimal)[1].length;
            const remainingDecimals = placeholderDecimalLength - decimalLength;

            remainingMask = `${remainingDecimals > 0 ? placeholderDecimal.slice(-1 * decimalLength) : ''}`;
        }

        return `${currentFormatter(intValue)}${isDecimal ? seperators.decimal : ''}`;
    }

    const formatters = {
        currency: {
            format() {
                return formatDecimals(formats.currency);
            },
            pattern: '\\$[0-9]{1,3}(,[0-9]{3}){0,}',
            prefix: '$',
        },

        currencyInt: {
            format() {
                const intValue = parseInt(value, 10);
                if (Number.isNaN(intValue)) {
                    return ' ';
                }

                if(placeholder.length <= rawValue.length) {
                    remainingMask = '';
                } else {
                    const remainingMaskLength = placeholder.length - rawValue.length;
                    remainingMask = placeholder.slice(-1 * remainingMaskLength);
                }
                return formats.currencyInt(intValue);
            },
            pattern: '\\$[0-9]{1,3}(,[0-9]{3}){0,}',
            prefix: '$',
        },

        int: {
            format() {
                const intValue = parseInt(value, 10);
                if (Number.isNaN(intValue)) {
                    return ' ';
                }

                if(placeholder.length <= rawValue.length) {
                    remainingMask = '';
                } else {
                    const remainingMaskLength = placeholder.length - rawValue.length;
                    remainingMask = placeholder.slice(-1 * remainingMaskLength);
                }
                return formats.int(intValue);
            },
            pattern: '[0-9]{1,3}(,[0-9]{3})*\\.[0-9]',

        },

        number: {
            format() {
                return formatDecimals(formats.number);
            },
            pattern: '[0-9]{1,3}(,[0-9]{3})*(\\.[0-9]+)?$',
        },

        percentInt: {
            format() {
                const intValue = parseInt(value, 10);
                if (Number.isNaN(intValue)) {
                    return ' ';
                }

                if(placeholder.length <= rawValue.length) {
                    remainingMask = '';
                } else {
                    const remainingMaskLength = placeholder.length - rawValue.length;
                    remainingMask = placeholder.slice(-1 * remainingMaskLength);
                }

                return `${formats.int(intValue)}`;
            },
            suffix: '%',
            pattern: '[0-9]{1,})%',
        },
    };

    value = rawValue.replace(/[^\d.-]/g, '');
    rawValue = prefix && !rawValue ? ' ' : rawValue;
    remainingMask = prefix ? placeholder.replace(prefix, '') : placeholder;
    $: formatter ||= formatters[format];
    $: prefix = format ? (formatters[format].prefix || '') : (prefix || '');
    $: suffix = format ? (formatters[format].suffix || '') : (suffix || '');
    $: hiddenValue = prefix && rawValue === ' ' ? '' : rawValue;
    $: decimalEndRegExp = new RegExp(`\\${seperators.decimal}$`);
    $: decimalRegExp = new RegExp(`\\${seperators.decimal}`);
    $: placeholderDecimal = placeholder?.split(seperators.decimal)[1];
    $: placeholderDecimalLength = placeholderDecimal?.length;

    async function update() {
        value = inputElement.value.replace(/[^\d.-]/g, '');
        currentPattern = null;

        rawValue = formatters[format].format();

        currentPattern = usedPattern;
    }

    $: usedPattern = required || value ? (format ? pattern || formatters[format].pattern : pattern) : null;
</script>

<style lang="scss">
    :invalid {
        outline: 1px solid red;
    }

    .shell {
        position: relative;
        line-height: 1;
    }

    .shell > span {
        position: absolute;
        top: 50%;
        left: 4px;
        transform: translateY(-50%);
        color: #ccc;
        pointer-events: none;
        z-index: -1;
    }
    .shell span i {
        font-style: normal;
        color: transparent;
        opacity: 0;
        visibility: hidden;
    }

    input.masked,
    .shell > span {
        font-size: 16px;
        font-family: monospace;
        padding-right: 10px;
        background-color: transparent;
        text-transform: uppercase;
    }

    .suffix {
        color: initial;
    }
</style>
<span class="shell">
	<span aria-hidden="true">{value.length ? '' : prefix}<i>{hiddenValue}</i>{remainingMask}<span class="suffix">{suffix}</span></span>
	<input
        bind:this={inputElement}
        class="masked"
        pattern={currentPattern}
        value={rawValue}
        on:input={update}
        {...$$restProps}
	/>
</span>
