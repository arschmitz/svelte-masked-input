import type { State } from './interactiveFormatter';
import InteractiveFormatter from './interactiveFormatter';
import {
    EVENTS
} from '../constants';
import { createStyleElement } from 'helpers';

interface InputValues {
    numericValue: number;
    unformattedValue: string;
    value: string;
}

interface FormattedInputOptions {
    callback?: (values: InputValues) => void;
    disabled?: boolean;
    disabledClass?: string;
    id?: number;
    polling?: boolean;
}

interface FormattedInputState extends State {
    cursorPosition: number;
    disabled: boolean;
    disabledClass: string;
    polling: boolean;
    styles: CSSStyleDeclaration;
}

export class FormattedInput extends InteractiveFormatter {
    #cursorPosition: number;

    #disabled: boolean;

    #disabledClass: string;

    #elements: {
        input: HTMLInputElement;
        mask: HTMLSpanElement;
        maskText: HTMLElement;
        style: HTMLStyleElement;
        suffix: HTMLSpanElement;
    }

    #id: number;

    #oldValue: string;

    #onChange: (values: InputValues) => void;

    #poll: number;

    #polling: boolean;

    #styles: CSSStyleDeclaration;

    #valueLength: number;

    constructor(
        locale: string,
        formatOptions: Intl.NumberFormatOptions,
        {
            onChange,
            disabled,
            disabledClass,
            id,
            polling,
        }: FormattedInputOptions
    ) {
        super(locale, formatOptions);

        this.#polling = polling;
        this.#disabled = disabled;
        this.#disabledClass = disabledClass;
        this.#id = id;
        this.#onChange = onChange;
    }

    get state(): FormattedInputState {
        return {
            ...super.state,
            cursorPosition: this.#cursorPosition,
            disabled: this.#disabled,
            disabledClass: this.#disabledClass,
            polling: this.#polling,
            styles: this.#styles,
        };
    }

    #handleInput(): void {
        this.update(this.#elements.input.value);
    }

    #handleSafariBlur(): void {
        if (!this.#elements.input || this.#elements.input.value === this.#oldValue) {
            return;
        }

        this.#elements.input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    #handleSafariFocus(): void {
        this.#oldValue = this.#elements.input.value;
    }

    destroy(): void {
        if (this.#poll) {
            clearInterval(this.#poll);
        }

        EVENTS.forEach((event) => {
            this.#elements.input?.removeEventListener(event, this.updateMaskStyle);
        });

        this.#elements.input?.removeEventListener('blur', this.#handleSafariBlur);
        this.#elements.input?.removeEventListener('focus', this.#handleSafariFocus);
        this.#elements.input?.removeEventListener('input', this.#handleInput);
    }

    mount({ element, mask }: { element: HTMLInputElement; mask: HTMLSpanElement; }): void {
        this.#elements.input = element;
        this.#elements.mask = mask;
        this.#styles = getComputedStyle(this.#elements.input);
        this.#elements.maskText = mask.querySelector('i');
        this.#elements.maskText.innerText = this.state.value;
        this.#elements.suffix = mask.querySelector('.suffix');
        this.#elements.suffix.innerText = this.formatParts.suffix;

        if (this.#polling) {
            this.#poll = window.setInterval(this.updateMaskStyle, 200);
        }

        EVENTS.forEach((event) => {
            this.#elements.input.addEventListener(event, this.updateMaskStyle.bind(this));
        });

        this.#elements.input.addEventListener('input', this.#handleInput.bind(this));

        // Would prefer to use feature detection but this does not seem possible
        if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
            this.#elements.input.addEventListener('focus', this.#handleSafariFocus.bind(this));
            this.#elements.input.addEventListener('blur', this.#handleSafariBlur.bind(this));
        }

        document.fonts.ready.then(() => this.updateMaskStyle());

        this.update(this.#elements.input.value);
    }

    update(input: string, { ignoreLength = false } = {}): void {
        this.#valueLength = this.state?.rawValue ? this.state.rawValue.length : 0;
        if (!ignoreLength) {
            this.#cursorPosition = this.#elements.input.selectionStart;
        }

        super.update(input);

        const { unformattedValue, value } = this.state;
        this.#onChange(this.state);

        const changeLength = value.length - this.#valueLength;

        this.#elements.input.dataset.strippedValue = unformattedValue;
        this.#elements.maskText.innerText = value;

        const position = this.#cursorPosition === this.#valueLength
            ? value.length
            : changeLength !== 1
                ? this.#cursorPosition
                : this.#cursorPosition + 1;

        setTimeout(() => {
            if (!this.#elements.input) {
                return;
            }

            this.#elements.input.selectionStart = position;
            this.#elements.input.selectionEnd = position;
        });
    }

    updateDisabled({ disabled, disabledClass }: { disabled: boolean; disabledClass: string; }): void {
        this.#disabled = disabled;
        this.#disabledClass = disabledClass;

        this.updateMaskStyle();
    }

    updateMaskStyle(): void {
        if (this.#elements.input) {
            this.#elements.input.classList.remove('copied');
        }
        setTimeout(() => {
            if (!this.#elements.mask?.isConnected || !this.#elements.input) {
                return;
            }

            const changes = {};

            if (this.#elements.input.classList.contains('copied')) {
                return;
            }

            const newStyleElement = createStyleElement({ id: this.#id, styles: this.#styles });

            if (this.#elements.style) {
                this.#elements.style.replaceWith(newStyleElement);
            } else {
                this.#elements.mask.append(newStyleElement);
            }

            this.#elements.style = newStyleElement;

            ['top', 'left', 'width', 'height'].forEach((dimension) => {
                const prop = `offset${dimension.charAt(0).toUpperCase() + dimension.slice(1)}`;
                if (this.#elements.input && this.#elements.mask.style[dimension] !== `${this.#elements.input[prop]}px`) {
                    changes[dimension] = `${this.#elements.input[prop]}px`;
                }
            });

            this.#elements.mask.classList[this.#disabled ? 'add' : 'remove'](this.#disabledClass);
            this.#elements.input.classList.add('copied');

            if (!Object.keys(changes).length) {
                return;
            }

            Object.assign(this.#elements.mask.style, changes);
        }, 1);
    }

    updateValue(input: string | number): void {
        setTimeout(() => {
            if (!this.#elements.input) {
                return;
            }

            if (typeof input === 'number') {
                input = `${input}`;
            }

            if (input === undefined) {
                this.#elements.input.value = '';
                this.update('');
                return;
            }

            const newValue = this.interactiveFormat(input);
            if ((newValue && newValue !== this.state.value)) {
                this.#cursorPosition = this.#elements.input.selectionStart;
                this.#valueLength = this.state.value.length;
                this.#elements.input.value = input;
                this.update(input, { ignoreLength: true });
            }
        });
    }
}
