<script lang="typescript">
    export let letter = '_';
    export let number = 'XdDmMyY9';
    export let placeholder = '';
    export let validExample = '';
    export let value = '';
    export let charset: string = null;
    export let pattern = '';
    export let prefix = '';
    export let required = false;

    let rawValue = '';
    let inputElement: HTMLInputElement;
    let currentPattern = null;
    let remainingMask = placeholder;

    $: value = charset ? rawValue.replace(/\W/g, '') : rawValue.replace(/[^\d.-]/g, '');
    $: prefix = (prefix || '');
    $: rawValue = prefix && !rawValue ? ' ' : rawValue;
    $: hiddenValue = prefix && rawValue === ' ' ? '' : rawValue;
    $: remainingMask = prefix ? placeholder.replace(prefix, '') : placeholder;
    $: usedPattern = required || value ? pattern : null;

    async function update(event) {
        const cursorPosBefore = inputElement.selectionStart;
        let cursorPosAfter;
        rawValue = inputElement.value;
        value = charset ? rawValue.replace(/\W/g, '') : rawValue.replace(/[^\d.-]/g, '');
        currentPattern = null;

        event.preventDefault();

        cursorPosAfter = inputElement.selectionStart;

        updateMask();
        currentPattern = usedPattern;

        if (cursorPosAfter - cursorPosBefore > 1 ) {
            inputElement.selectionStart = cursorPosBefore;
            inputElement.selectionEnd = cursorPosBefore;
        }
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
        value={rawValue}
        on:keyup={update}
        maxlength={placeholder.length}
        {...$$restProps}
	/>
</span>
