<script lang="ts" context="module">
    let inputId = 1;
</script>

<script lang="ts">
    import { afterUpdate, onDestroy, onMount } from "svelte";
    import { Format } from '../constants';
    import { FormattedInput } from './formattedInput';

    export let currency = 'USD';
    export let format: Format;
    export let formatOptions: Intl.NumberFormatOptions = {};
    export let inputElement: HTMLInputElement = null;
    export let locale = 'en-us';
    export let numericValue: number;
    export let placeholder = '';
    export let polling = false;
    export let value: string| number = '';
    export let unformattedValue = '';
    export let disabledClass = 'disabled';
    export let disabled = false;

    let _class = '';
    export { _class as class };

    const id = ++inputId;

    let mask: HTMLSpanElement;
    let formattedInput: FormattedInput;

    if (typeof value === 'number') {
        value = `${value}`;
    }

    $: initalize(currency, format, formatOptions, locale);
    $: updateOptions({ disabled, disabledClass });
    $: updateValue(value);

    function initalize(..._: unknown[]) {
        formattedInput = new FormattedInput({
            callback: update,
            currency,
            disabled,
            disabledClass,
            formatOptions,
            id,
            locale,
            polling,
            type: format,
        });
    }

    function updateOptions(..._: unknown[]) {
        formattedInput.updateOptions({ disabled, disabledClass });
    }

    function update({ numericValue: _numericValue, unformattedValue: _unformattedValue, value: _value }) {
        numericValue = _numericValue;
        unformattedValue = _unformattedValue;
        value = _value;
    }

    function updateValue(..._: unknown[]) {
        formattedInput.updateValue(value);
    }

    onMount(() => formattedInput.mount({ element: inputElement, mask }));

    afterUpdate(() => {
        if (!polling) {
            formattedInput.updateMaskStyle();
        }
    });

    onDestroy(() => formattedInput.destroy());
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
    {#if value}
        <i></i><span class="suffix"></span>
    {/if}
</span>
<input
    bind:this={inputElement}
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
