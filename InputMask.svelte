<script lang="typescript">
    export let letter = '_';
    export let number = 'XdDmMyY9';
    export let placeholder = '';
    export let type = 'text';
    export let validExample = '';
    export let value = '';
    export let charset: boolean = null;
    export let pattern = '';
    export let format = '';
    export let prefix = '';
    export let required = false;
    export let formatter;
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
                    collection[part.type] = part.value;
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
        const isDecimal = decimalEndRegExp.test(rawValue);
        const hasDecimal = decimalRegExp.test(rawValue);
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
                return formats.percentInt(intValue);
            },
            pattern: '[0-9]{1,})%',
        },
    };

    $: formatter ||= formatters[format];
    $: value = charset ? rawValue.replace(/\W/g, '') : rawValue.replace(/[^\d.-]/g, '');
    $: prefix = format ? (formatters[format].prefix || '') : (prefix || '');
    $: rawValue = prefix && !rawValue ? ' ' : rawValue;
    $: hiddenValue = prefix && rawValue === ' ' ? '' : rawValue;
    $: remainingMask = prefix ? placeholder.replace(prefix, '') : placeholder;
    $: decimalEndRegExp = new RegExp(`\\${seperators.decimal}$`);
    $: decimalRegExp = new RegExp(`\\${seperators.decimal}`);
    $: placeholderDecimal = placeholder?.split(seperators.decimal)[1];
    $: placeholderDecimalLength = placeholderDecimal?.length;

    async function update(event) {
        rawValue = event.key === 'Backspace' ? inputElement.value.slice(0, -1) : inputElement.value + event.key;
        value = charset ? rawValue.replace(/\W/g, '') : rawValue.replace(/[^\d.-]/g, '');
        currentPattern = null;

        event.preventDefault();

        if (format) {
            rawValue = formatters[format].format();
        } else {
            updateMask();
        }
        currentPattern = usedPattern;
    }

    function updateMask(): void {
        let newValue = '';

        const strippedValue = value.replace(/\D/g, '');

        for (let i = 0, j = 0; i < placeholder.length; i++) {
            const isInt = !Number.isNaN(parseInt(strippedValue[j], 10));
            const isLetter = strippedValue[j] ? strippedValue[j].match(/[A-Z]/i) : false;
            const matchesNumber = number.indexOf(placeholder[i]) >= 0;
            const matchesLetter = letter.indexOf(placeholder[i]) >= 0;

            if ((matchesNumber && isInt) || (charset && matchesLetter && isLetter)) {
                newValue += strippedValue[j++];
            } else if (
                (!charset && !isInt && matchesNumber)
                || (charset && ((matchesLetter && !isLetter) || (matchesNumber && !isInt)))
            ) {
                console.error('Invalid Character');
                rawValue = newValue;
            } else {
                newValue += placeholder[i];
            }

            // break if no characters left and the pattern is non-special character
            if (strippedValue[j] === undefined) {
                break;
            }
        }

        if (validExample) {
            value = validateProgress(newValue);
        }

        rawValue = newValue;
        remainingMask = placeholder.substring(rawValue.length);
        currentPattern = usedPattern;
    }

    function validateProgress(newValue) {
        let testValue = '';
        const patternRegEx = new RegExp(pattern);

        // Convert to months
        if (newValue.length === 1 && placeholder.toUpperCase().substring(0, 2) === 'MM') {
            if (newValue > 1 && newValue < 10) {
                newValue = `0${newValue}`;
            }
            return newValue;
        }

        // test the value, removing the last character, until what you have is a submatch
        for (let i = newValue.length; i >= 0; i--) {
            testValue = newValue + validExample.substring(newValue.length);

            if (patternRegEx.test(testValue)) {
                return newValue;
            }

            newValue = newValue.substring(0, newValue.length - 1);
        }

        return newValue;
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

    .shell span {
        position: absolute;
        left: 9px;
        top: 4px;
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
    .shell span {
        font-size: 16px;
        font-family: monospace;
        padding-right: 10px;
        background-color: transparent;
        text-transform: uppercase;
    }
</style>
<span class="shell">
	<span aria-hidden="true">{value.length ? '' : prefix}<i>{hiddenValue}</i>{remainingMask}</span>
	<input
        bind:this={inputElement}
        class="masked"
        pattern={currentPattern}
        {type}
        value={rawValue}
        on:keydown={update}
        maxlength={format ? null : placeholder.length}
	/>
</span>
