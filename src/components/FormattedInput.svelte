<script lang="ts" context="module">
    let inputId = 1;
</script>

<script lang="ts">
    import type { FormatStyles, Formatter, Formatters } from '../types';
    import { afterUpdate, onDestroy, onMount } from "svelte";
    import { EVENTS } from '../constants';
    import { createStyleElement, unformat, formatterConstructor, styleMap, escape, getFormatParts } from '../helpers';

    export let currency = 'USD';
    export let format = '';
    export let formatOptions: Intl.NumberFormatOptions = {};
    export let formatter: Formatter = null;
    export let inputElement: HTMLInputElement = null;
    export let locale = 'en-us';
    export let numericValue: number;
    export let placeholder = '';
    export let polling = false;
    export let prefix = '';
    export let value: string| number = '';
    export let strippedValue = '';
    export let disabledClass = 'disabled';
    export let disabled = false;

    let _class = '';
    export { _class as class };

    const id = ++inputId;

    let mask: HTMLSpanElement;
    let poll: number;
    let styles: CSSStyleDeclaration;
    let formatters: Formatters;
    let formatterObject: Formatter;
    let oldFormat: string;
    let styleElement: HTMLStyleElement;
    let oldValue: string;
    let cursorPosBefore: number;
    let originalLength: number;
    let previousValue: string;

    if (typeof value === 'number') {
        value = value.toLocaleString(locale);
    }

    strippedValue = unformat(value, { currency, locale, type: styleMap[format] });
    numericValue = Number.isNaN(parseFloat(strippedValue)) ? null : parseFloat(strippedValue);
    previousValue = value || '';
    $: formatters = formatterConstructor({ currency, formatOptions, locale });

    $: formatterObject = formatters[format] || formatter;
    $: prefix = format ? (formatterObject?.prefix || '') : (prefix || '');
    $: suffix = format ? (formatterObject?.suffix || '') : (suffix || '');
    $: updateMaskStyle(disabled);
    $: formatStyle = (format.replace(/int/i, '') || 'number') as FormatStyles
    $: formatParts = getFormatParts({ locale, currency })[formatStyle];

    let rawValue = formatterObject?.prefix && !strippedValue ? '' : strippedValue;

    $: updateValue(currency, format, locale, value);

    function getInputValues(newValue?: string, deleted?: boolean) {
        return {
            deleted,
            elementValue: inputElement?.value,
            newValue,
            previousValue,
            rawValue,
            strippedValue
        }
    }

    function clear() {
        previousValue = inputElement.value;
        inputElement.value = '';
        strippedValue = '';
        inputElement.dataset.strippedValue = '';
        inputElement.dataset.numericValue = null;
        numericValue = null;
        oldFormat = format;
    }

    function updateValue(..._: unknown[]) {
        setTimeout(() => {
            if (!inputElement) {
                return;
            }

            if (typeof value === 'number') {
                value = value.toLocaleString(locale);
            }

            if (!value) {
                clear();
                return;
            }

            const newRaw = formatterObject?.format({
                elementValue: value,
                newValue: null,
                previousValue: rawValue,
                rawValue: value,
                strippedValue: unformat(value || '', {
                    currency,
                    locale,
                    type: formatStyle,
                })
            });

            if (newRaw !== rawValue || oldFormat !== format) {
                cursorPosBefore = inputElement.selectionStart;
                originalLength = rawValue.length;
                rawValue = inputElement.value = value;
                update({ ignoreLength: true });
            }
        });
    }

    function update({ ignoreLength = false, deleted = false } = {}) {
        if (!inputElement.value) {
            clear();
            return;
        }

        if (!ignoreLength) {
            cursorPosBefore = inputElement.selectionStart;
            originalLength = rawValue.length;
        }

        const prevGroupRegExp = new RegExp(`${escape(formatParts.group)}$`);
        if (
            inputElement.selectionStart === inputElement.selectionEnd
            && deleted
            && prevGroupRegExp.test(
               previousValue.slice(0, -(previousValue.length - inputElement.selectionStart - 1))
            )
        ) {
            rawValue = previousValue;
            inputElement.value = previousValue;

            setTimeout(() => {
                if (!inputElement) {
                    return;
                }

                inputElement.selectionStart = cursorPosBefore;
                inputElement.selectionEnd = cursorPosBefore;
            });

            return;
        }

        oldFormat = format;

        strippedValue = unformat(inputElement.value, { currency, locale, type: styleMap[format] });

        rawValue = formatterObject?.format(getInputValues(null, deleted));

        const changeLength = rawValue.length - originalLength;
        strippedValue = unformat(rawValue, { currency, locale, type: styleMap[format] });
        const floatValue = parseFloat(strippedValue)
        numericValue = Number.isNaN(floatValue) ? null : floatValue;

        inputElement.dataset.strippedValue = strippedValue;

        value = rawValue

        const position = cursorPosBefore === originalLength
            ? rawValue.length
            : changeLength !== 1
                ? cursorPosBefore
                : cursorPosBefore + 1

        setTimeout(() => {
            if (!inputElement) {
                return;
            }

            previousValue = rawValue;
            inputElement.selectionStart = position;
            inputElement.selectionEnd = position;
        });
    }

    function _update(this: HTMLInputElement, event: InputEvent) {
        return update({ deleted: event.inputType === 'deleteContentBackward' });
    }

    function updateMaskStyle(..._: unknown[]) {
        if (inputElement) {
            inputElement.classList.remove('copied');
        }
        setTimeout(() => {
            if (!mask?.isConnected || !inputElement) {
                return;
            }

            const changes = {};

            if (inputElement.classList.contains('copied')) {
                return;
            }

            const newStyleElement = createStyleElement({ id, styles });

            if (styleElement) {
                styleElement.replaceWith(newStyleElement);
            } else {
                mask.append(newStyleElement);
            }

            styleElement = newStyleElement;

            ['top', 'left', 'width', 'height'].forEach((dimension) => {
                const prop = `offset${dimension.charAt(0).toUpperCase() + dimension.slice(1)}`;
                if (inputElement && mask.style[dimension] !== `${inputElement[prop]}px`) {
                    changes[dimension] = `${inputElement[prop]}px`;
                }
            });

            mask.classList[disabled ? 'add' : 'remove'](disabledClass);
            inputElement.classList.add('copied');

            if (!Object.keys(changes).length) {
                return;
            }

            Object.assign(mask.style, changes);
        }, 1);
    }

    function handleSafariBlur() {
        if (!inputElement || inputElement.value === oldValue) {
            return;
        }

        inputElement.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function handleSafariFocus() {
        oldValue = inputElement.value;
    }

    onMount(() => {
        styles = getComputedStyle(inputElement);

        if (polling) {
            poll = window.setInterval(updateMaskStyle, 200);
        }

        EVENTS.forEach((event) => {
            inputElement.addEventListener(event, updateMaskStyle);
        });

        inputElement.addEventListener('input', _update);

        // Would prefer to use feature detection but this does not seem possible
        if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
            inputElement.addEventListener('focus', handleSafariFocus)
            inputElement.addEventListener('blur', handleSafariBlur);
        }

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

        EVENTS.forEach((event) => {
            inputElement?.removeEventListener(event, updateMaskStyle);
        });

        inputElement?.removeEventListener('blur', handleSafariBlur);
        inputElement?.removeEventListener('focus', handleSafariFocus);
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
        box-sizing: border-box;
    }

    .copied {
        background: none !important;
        background-color: transparent !important;
        background-image: none !important;
    }

    .suffix {
        color: initial;
    }
</style>

<span
    aria-hidden="true"
    data-formatted-id={id}
    class="formatted-input-mask"
    bind:this={mask}
>
    {#if rawValue}
        <i>{rawValue}</i><span class="suffix">{suffix}</span>
    {/if}
</span>
<input
    bind:this={inputElement}
    bind:value={rawValue}
    class={_class}
    data-format={format}
    {disabled}
    on:blur
    on:change
    on:focus
    on:input
    on:keydown
    {placeholder}
    inputmode="tel"
    type="text"
    {...$$restProps}
/>
