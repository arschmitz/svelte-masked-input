import { SvelteComponentTyped } from 'svelte';
import { Formats } from '../helpers';

export interface FormattedInputProps extends svelte.JSX.SvelteInputProps {
    class?: string;
    currency?: string;
    disabled?: boolean;
    disabledClass?: string;
    format?: Formats;
    formatOptions?: Intl.NumberFormatOptions;
    formatter?: Formatter;
    inputElement?: HTMLInputElement;
    locale?: string;
    placeholder?: string;
    polling?: boolean;
    prefix?: string;
    strippedValue?: string;
    value?: string| number;
}

export default class FormattedInput extends SvelteComponentTyped<FormattedInputProps> {}
