import type { InteractiveFormatterOptions } from 'types';
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

interface FormattedInputOptions extends InteractiveFormatterOptions {
    callback: (values: InputValues) => void;

    disabled: boolean;

    disabledClass: string;

    id: number;

    polling: boolean;
}

export class FormattedInput extends InteractiveFormatter {
    callback: (values: InputValues) => void;

    disabled: boolean;

    disabledClass: string;

    element: HTMLInputElement;

    id: number;

    mask: HTMLSpanElement;

    maskTextElement: HTMLElement;

    oldValue: string;

    poll: number;

    polling: boolean;

    styleElement: HTMLStyleElement;

    styles: CSSStyleDeclaration;

    suffixElement: HTMLSpanElement;

    constructor({
        callback,
        disabled,
        disabledClass,
        id,
        locale,
        currency,
        formatOptions,
        polling,
        type,
    }: FormattedInputOptions) {
        super({ currency, formatOptions, locale, type });

        this.polling = polling;
        this.disabled = disabled;
        this.disabledClass = disabledClass;
        this.id = id;
        this.callback = callback;
    }

    destroy(): void {
        if (this.poll) {
            clearInterval(this.poll);
        }

        EVENTS.forEach((event) => {
            this.element?.removeEventListener(event, this.updateMaskStyle);
        });

        this.element?.removeEventListener('blur', this.handleSafariBlur);
        this.element?.removeEventListener('focus', this.handleSafariFocus);
        this.element?.removeEventListener('input', this.handleInput);
    }

    handleInput(): void {
        this.update(this.element.value);
    }

    handleSafariBlur(): void {
        if (!this.element || this.element.value === this.oldValue) {
            return;
        }

        this.element.dispatchEvent(new Event('change', { bubbles: true }));
    }

    handleSafariFocus(): void {
        this.oldValue = this.element.value;
    }

    mount({ element, mask }: { element: HTMLInputElement; mask: HTMLSpanElement; }): void {
        this.element = element;
        this.mask = mask;
        this.styles = getComputedStyle(this.element);
        this.maskTextElement = mask.querySelector('i');
        this.maskTextElement.innerText = this.value;
        this.suffixElement = mask.querySelector('.suffix');
        this.suffixElement.innerText = this.formatParts.suffix;

        if (this.polling) {
            this.poll = window.setInterval(this.updateMaskStyle, 200);
        }

        EVENTS.forEach((event) => {
            this.element.addEventListener(event, this.updateMaskStyle.bind(this));
        });

        this.element.addEventListener('input', this.handleInput.bind(this));

        // Would prefer to use feature detection but this does not seem possible
        if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
            this.element.addEventListener('focus', this.handleSafariFocus.bind(this));
            this.element.addEventListener('blur', this.handleSafariBlur.bind(this));
        }

        document.fonts.ready.then(() => this.updateMaskStyle());

        this.update(this.element.value);
    }

    update(input: string, { ignoreLength = false } = {}): void {
        this.valueLength = this.rawValue.length;
        if (!ignoreLength) {
            this.cursorPosition = this.element.selectionStart;
        }

        this.format(input);

        const { numericValue, unformattedValue, value } = this;
        this.callback({ numericValue, unformattedValue, value });

        const changeLength = this.value.length - this.valueLength;

        this.element.dataset.strippedValue = this.unformattedValue;
        this.maskTextElement.innerText = this.value;

        const position = this.cursorPosition === this.valueLength
            ? this.value.length
            : changeLength !== 1
                ? this.cursorPosition
                : this.cursorPosition + 1;

        setTimeout(() => {
            if (!this.element) {
                return;
            }

            this.element.selectionStart = position;
            this.element.selectionEnd = position;
        });
    }

    updateMaskStyle(): void {
        if (this.element) {
            this.element.classList.remove('copied');
        }
        setTimeout(() => {
            if (!this.mask?.isConnected || !this.element) {
                return;
            }

            const changes = {};

            if (this.element.classList.contains('copied')) {
                return;
            }

            const newStyleElement = createStyleElement({ id: this.id, styles: this.styles });

            if (this.styleElement) {
                this.styleElement.replaceWith(newStyleElement);
            } else {
                this.mask.append(newStyleElement);
            }

            this.styleElement = newStyleElement;

            ['top', 'left', 'width', 'height'].forEach((dimension) => {
                const prop = `offset${dimension.charAt(0).toUpperCase() + dimension.slice(1)}`;
                if (this.element && this.mask.style[dimension] !== `${this.element[prop]}px`) {
                    changes[dimension] = `${this.element[prop]}px`;
                }
            });

            this.mask.classList[this.disabled ? 'add' : 'remove'](this.disabledClass);
            this.element.classList.add('copied');

            if (!Object.keys(changes).length) {
                return;
            }

            Object.assign(this.mask.style, changes);
        }, 1);
    }

    updateOptions({ disabled, disabledClass }: { disabled: boolean; disabledClass: string; }): void {
        this.disabled = disabled;
        this.disabledClass = disabledClass;

        this.updateMaskStyle();
    }

    updateValue(input: string | number): void {
        setTimeout(() => {
            if (!this.element) {
                return;
            }

            if (typeof input === 'number') {
                input = `${input}`;
            }

            if (input === undefined) {
                this.element.value = '';
                this.update('');
                return;
            }

            const newValue = this.trimInput(input);
            if ((newValue && newValue !== this.value)) {
                this.cursorPosition = this.element.selectionStart;
                this.valueLength = this.value.length;
                this.element.value = input;
                this.update(input, { ignoreLength: true });
            }
        });
    }
}
