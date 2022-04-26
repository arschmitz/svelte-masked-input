<script lang="ts">
    import type { Formatter, Formatters, Seperators } from '../helpers';
    import { afterUpdate, onDestroy, onMount, tick } from "svelte";
    import { BACKGROUND_STYLES, EVENTS, STYLES } from '../constants';
    import { unformat, getSeperators, formatConstructor, formatterConstructor } from '../helpers';

    export let currency = 'USD';
    export let format = '';
    export let formatOptions: Record<string, number | string> = {};
    export let formatter: Formatter = null;
    export let inputElement: HTMLInputElement = null;
    export let locale = 'en-us';
    export let placeholder = '';
    export let polling = false;
    export let prefix = '';
    export let value: string| number = '';
    export let strippedValue = '';

    let _class = '';
    export { _class as class };

    let seperators: Seperators;
    let mask: HTMLSpanElement;
    let poll: number;
    let styles: CSSStyleDeclaration;
    let formatters: Formatters;
    let formatterObject: Formatter;
    let oldFormat: string;

    if (typeof value === 'number') {
        value = `${value}`;
    }

    $: formats = formatConstructor({ currency, formatOptions, locale });
    strippedValue = unformat(value);
    $: seperators = getSeperators(locale);
    $: formatters = formatterConstructor(formats);

    $: formatterObject = formatters[format] || formatter;
    $: prefix = format ? (formatterObject?.prefix || '') : (prefix || '');
    $: suffix = format ? (formatterObject?.suffix || '') : (suffix || '');

    let rawValue = formatterObject?.prefix && !strippedValue ? '' : strippedValue;

    $: updateValue(value, format);

    function getInputValues(newValue?: string) {
        return {
            elementValue: inputElement?.value,
            newValue,
            rawValue,
            strippedValue,
            seperators
        }
    }

    function updateValue(..._: unknown[]) {
        setTimeout(() => {
            if (typeof value === 'number') {
                value = `${value}`;
            }

            if (value === undefined) {
                inputElement.value = '';
                update();
                return;
            }

            const newRaw = formatterObject?.format(getInputValues(value));
            if ((newRaw && newRaw !== rawValue) || (oldFormat !== format)) {
                rawValue = value;
                update();
            }
        });
    }

    function update() {
        const cursorPosBefore = inputElement.selectionStart;
        const originalLength = rawValue.length;

        oldFormat = format;

        strippedValue = unformat(inputElement.value);

        rawValue = formatterObject?.format(getInputValues());

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
            if (!mask?.isConnected) {
                return;
            }

            const changes = {};

            STYLES.forEach((prop) => {
                if (mask.style[prop] !== styles[prop]) {
                    changes[prop] = styles[prop]
                }
            });

            ['top', 'left', 'width', 'height'].forEach((dimension) => {
                const prop = `offset${dimension.charAt(0).toUpperCase() + dimension.slice(1)}`;
                if (inputElement && mask.style[dimension] !== `${inputElement[prop]}px`) {
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
            BACKGROUND_STYLES.reduce((copied, prop) => {
                copied[prop] = styles[prop];
                return copied;
            }, {}),
        );

        if (polling) {
            poll = window.setInterval(updateMaskStyle, 200);
        }

        EVENTS.forEach((event) => {
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

        EVENTS.forEach((event) => {
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
    {#if rawValue}
        <i>{rawValue}</i><span class="suffix">{suffix}</span>
    {/if}
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
    {placeholder}
    inputmode="tel"
    type="text"
    {...$$restProps}
/>
