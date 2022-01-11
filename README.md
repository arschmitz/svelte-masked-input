Svelte Masked Input
=====================

## Features

Svelte Masked Input enables you to include a mask on any input where a specific data entry format is required. The placeholder text remains in place, displaying which characters still need to be included. The placeholder is CSS styleable.

The user can enter letters and numbers. All other characters, like spaces, dashes, and parenthesis are automatically added by the script, making data entery easier when using dynamic keypads.


## Example

<http://arschmitz.me/svelte-masked-input>

## Quick Start

```sh
npm install svelte-masked-input
```

```svelte
<script>
  import MaskedInput from 'svelte-masked-input';
</script>

<MaskedInput
    id="cc-exp"
    pattern="(1[0-2]|0[1-9])\/\d\d"
    placeholder="MM/YY"
    title="2-digit month and 2-digit year greater than 01/15"
    type="tel"
    validExample="11/18"
/>
```

Add inputs with `id`, `placeholder` and `pattern` attributes with the class of `masked`. Include `type="tel"` when requiring numbers only.
```svelte
	 <label for="zip"></label>
  	 <MaskedInput
        id="zip"
        type="tel"
        placeholder="XXXXX"
        pattern="\d{5}"
  	    name="uszipcode"
        title="5-digit zip code"
    />
```

If your placeholder includes non-digits and non-letters, no worries. They'll be added by the script. Your mobile users won't have to change their touch keyboards. They simply need to enter letters.

Do make sure that your placeholder would match the regular expression of your pattern if all the X's were converted to integers.

If your regular expressions include letters, you must include the `charset` attribute. Similar to the pattern, include an `X` for each number and an underscore `_` for each required letter.

```svelte
	<label for="zipca">Canadian Zip Code</label>
  	<MaskedInput
        placeholder="XXX XXX"
        pattern="\w\d\w \d\w\d"
  		charset="_X_ X_X"
        id="zipca"
        type="text"
        name="zipcodeca"
  	    title="6-character alphanumeric zip code in the format of A1A 1A1"
    />
```

If the digits allowed by your regular expression are constrained or complicated, such as months only allowing 01-12, include a made up `data-valid-example` attribute that takes as its value a valid value that would match the pattern.

```svelte
	<label for="expiration"> Credit Card Expiration </label>
    <MaskedInput
        id="expiration"
        type="tel"
        placeholder="MM/YY"
    	pattern="(1[0-2]|0[1-9])\/(1[5-9]|2\d)"
    	data-valid-example="05/18"
    />
```

## Accessibility

There are accessibility features baked into the examples that you must maintain to maintain accessibility.

* Always include a label for each form control, and associate the form control either implicitly by nesting it, or explicitly with the `for` and `id` attributes.
* Always include a `title` attribute that describes the expected pattern when including the `pattern` attribute.
* Always use the best input `type` for the job, so dynamic touchpad users get the right touchpad for the job. Generally this will always be `type="tel"`, as most masking is for digits only. However, when alphanumeric characters are required, use `type="text"`. And, while I've included an expiration month to show an example of using complex regular expressions, use `type="month"` instead of this script.

### Options

#### number
Want to use something other than X? right now the script handles XdDmMyY9 for numeric placeholding. MM/YY and mm/yy will work fine. Want to use something else, simply pass an options object setting the `number` option.

```svelte
<MaskedInput
    id="z"
    name="z"
    number="z"
    placeholder="zzz zzz"
    title="6-character numeric code in the format of zzz zzz"
    type="text"
/>
```

#### letter
Want to use something other than X in your placeholder look for masked inputs that require both letters and numbers, you can. You can put different characters in your placeholder, as long as your `charset` contains Xs and _ only.

```svelte
<MaskedInput
    charset="?X? X?X"
    id="zipca"
    name="canadianzip"
    pattern="\w\d\w \d\w\d"
    placeholder="XXX XXX"
    title="6-character alphanumeric code in the format of A1A 1A1"
    type="text"
/>
```

If you require _ as a special character in your mask? Simply pass an options object setting the `letter` option, and also the value of `charset` in your HTML.


```svelte
<MaskedInput
    charset="?X?_X?X"
    id="underscore"
    letter="?"
    name="underscoredstring"
    pattern="\w\d\w\_\d\w\d"
    placeholder="XXX_XXX"
    title="6-character alphanumeric code in the format of A1A_1A1"
    type="text"
/>
```

#### noValidate

As the *pattern* attribute is being used, you may want to add via javascript the *novalidate* attribute on any ancestor `form` or form control to disable native browser validation. Do add it via JS, because if the JS fails, native validation is a good alternative.

## Documentation

Handles these test cases:

* OK if the pattern starts with a special character
* OK if the next letter is a special character
* Can handle more than one special character
* Doesn't matter if browser supports placeholder attribute: appears even in IE8
* Doesn't matter if browser supports pattern attribute: still works
* characters can be deleted or added mid input
* Arrow keys can be used
* Sets up maxlength based on placeholder length
* Only uppercase letters are shown (this can be changed)
* If user enters an invalid character, character deleted
* Enters special characters automagically
* No unwanted characters are read by screen reader
* Supports keyboard, mouse and touchpad
* Works if the user leaves the input and comes back
* If user gives focus before a special character, jumps forward if typed in.
* Matches simple regular expressions
* Can be made to match complex regular expression

## Exceptions

#### Complex Regular Expressions
If the digits allowed by your regular expression are constrained or complicated, such as months only allowing 01-12, include a made up `validExample` attribute that takes as its value a **valid** value that would match the pattern.

```svelte
    <label for="expiration">Credit Card Expiration</label>
	<MaskedInput
    	validExample="11/18"
    	pattern="(1[0-2]|0[1-9])\/(1[5-9]|2\d)"
    	title="2-digit month and 2-digit year greater than 01/15"
        id="expiration"
        placeholder="MM/YY"
        type="tel"
    />
```

MM is handled , because that is common. If you have  exceptions, add the exceptions there. If you need an expiration month, it is best to use `<MaskedInput type="month">` instead.
