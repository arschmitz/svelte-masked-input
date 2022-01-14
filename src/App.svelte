<script lang="typescript">
	import MaskedInput from './components/MaskedInput.svelte';
    import FormattedInput from './components/FormattedInput.svelte';
</script>

<style lang="scss">
    * {
        box-sizing: border-box;
    }
	main {
		text-align: center;
		padding: 1em;
		margin: 0 auto;
	}
	h1 {
		color: #ff3e00;
		font-size: 4em;
		font-weight: 900;
	}
    h2 {
        font-size: 2.5em;
    }
    h1,h2 {
        font-family: 'Cutive Mono', monospace;
    }
    :global(body *) {
        font-family: 'Cutive Mono', monospace !important;
    }
    :global(body p) {
        font-size: 1.5rem;
        font-family: 'Noto Sans JP', sans-serif !important;
    }
	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
    .grid {
        display: grid;
        grid-template-columns: 1fr;

        @media (min-width: 640px) {
            grid-template-columns: 1fr 1fr;
	    }
    }

    li > label:first-child {
        font-size: 1.25rem;
        display: block;
        font-family: 'Noto Serif JP', serif !important;
        margin-bottom: 0.5rem;
    }

    .item {
        margin: 2rem;
    }

    img {
        width: 400px;
    }

    ul {
        list-style: none;
        padding: 0;
    }

    :global(input), :global(.shell span) {
        padding: 0.25rem;
        border-radius: 0.25rem;
    }

    li {
        text-align: left;
        margin-bottom: 1rem;
        position: relative;
    }

    pre {
        display: none;
        background: black;
        color: white;
        padding: 1rem;
        border: 4px inset red;
    }

    input:checked + pre {
        display: block;
    }

    .toggle {
        border: 1px solid;
        padding: 0.25rem;
        border-radius: 0.25rem;
        font-weight: 900;
        cursor: pointer;

        &:hover {
            background: #eee;
        }

        &:active {
            background: #333;
            color: white;
        }
    }

    input[type="checkbox"] {
        display: none;
    }

    :global(input:hover) {
        background-color: blue;
    }

    .big :global(input) {
        padding: 2rem;
        font-size: 2rem;
        border: orange solid 3px;
    }
</style>

<main>
    <img src="./masked-input-logo.svg" alt="logo" />
	<h1>Svelte Masked Input</h1>
    <p>Cybernetically Enhanced Inputs with Masks for Svelte Apps</p>
    <div class="grid">
        <div class="item">
            <h2>Masked Inputs</h2>
            <hr>
            <ul>
                <li>
                    <label for="cc-exp">Credit Card Expiration Month</label>
                    <MaskedInput id="cc-exp" type="tel" placeholder="MM/YY" pattern="(1[0-2]|0[1-9])\/\d\d" validExample="11/18" title="2-digit month and 2-digit year greater than 01/15" />

                    <label class="toggle" for="cc-exp-markup">Show Markup</label><input id="cc-exp-markup" type="checkbox"/>
                    <pre>
                        <code>
&lt;label for="cc-exp">Credit Card Expiration Month&lt;/label>
&lt;MaskedInput
    id="cc-exp"
    pattern="(1[0-2]|0[1-9])\/\d\d"
    placeholder="MM/YY"
    title="2-digit month and 2-digit year greater than 01/15"
    type="tel"
    validExample="11/18"
/>
                        </code>
                    </pre>
                </li>
                <li>
                    <label for="zip">Zip Code</label>
                    <MaskedInput id="zip" type="tel" placeholder="XXXXX" pattern="\d{5}" title="5-digit zip code" />

                    <label class="toggle" for="zip-markup">Show Markup</label><input id="zip-markup" type="checkbox"/>
                    <pre>
                        <code>
&lt;label for="zip">Zip Code&lt;/label>
&lt;MaskedInput
    id="zip"
    type="tel"
    placeholder="XXXXX"
    pattern="\d{5}"
    title="5-digit zip code"
/>
                        </code>
                    </pre>
                </li>
                <li>
                    <label for="ca-zip">Canadian Zip Code</label>
                    <MaskedInput id="ca-zip" placeholder="XXX XXX" pattern="\w\d\w \d\w\d" charset="_X_ X_X" title="6-character alphanumeric zip code in the format of A1A 1A1" />

                    <label class="toggle" for="ca-zip-markup">Show Markup</label><input id="ca-zip-markup" type="checkbox"/>
                    <pre>
                        <code>
&lt;label for="ca-zip">Canadian Zip Code&lt;/label>
&lt;MaskedInput
    charset="_X_ X_X"
    id="ca-zip"
    pattern="\w\d\w \d\w\d"
    placeholder="XXX XXX"
    title="6-character alphanumeric zip code in the format of A1A 1A1"
/>
                        </code>
                    </pre>
                </li>
                <li>
                    <label for="tel">Telephone</label>
                    <MaskedInput id="tel" placeholder="(XXX) XXX-XXXX" pattern="\(\d{3}\) \d{3}\-\d{4}"  title="10-digit number" />

                    <label class="toggle" for="tel-markup">Show Markup</label><input id="tel-markup" type="checkbox"/>
                    <pre>
                        <code>
&lt;label for="tel">Telephone&lt;/label>
&lt;MaskedInput
    id="tel"
    pattern="\(\d{3}\) \d{3}\-\d{4}"
    placeholder="(XXX) XXX-XXXX"
    title="10-digit number"
/>
                        </code>
                    </pre>
                </li>
                <li>
                    <label for="cc">Credit Card Number</label>
                    <MaskedInput id="cc" placeholder="XXXX XXXX XXXX XXXX" pattern="\d{4} \d{4} \d{4} \d{4}" title="16-digit number" />

                    <label class="toggle" for="cc-markup">Show Markup</label><input id="cc-markup" type="checkbox"/>
                    <pre>
                        <code>
&lt;label for="cc">Credit Card Number&lt;/label>
&lt;MaskedInput
    id="cc"
    pattern="\d{4} \d{4} \d{4} \d{4}"
    placeholder="XXXX XXXX XXXX XXXX"
    title="16-digit number"
/>
                        </code>
                    </pre>
                </li>
            </ul>
        </div>

        <div class="item">
            <h2>Formatted Inputs</h2>
            <hr>
            <ul>
                <li>
                    <label for="number">Number</label>
                    <FormattedInput id="number" placeholder="0.00" format="number"/>

                    <label class="toggle" for="number-markup">Show Markup</label><input id="number-markup" type="checkbox"/>
                    <pre>
                        <code>
&lt;label for="number">Number&lt;/label>
&lt;FormattedInput id="number" placeholder="0.00" format="number" />
                        </code>
                    </pre>
                </li>
                <li>
                    <label for="int">Int</label>
                    <FormattedInput id="int" placeholder="X" format="int" />

                    <label class="toggle" for="int-markup">Show Markup</label><input id="int-markup" type="checkbox"/>
                    <pre>
                        <code>
&lt;label for="int">Int&lt;/label>
&lt;FormattedInput id="int" placeholder="X" format="int" />
                        </code>
                    </pre>
                </li>
                <li>
                    <label for="currency">Currency</label>
                    <FormattedInput id="currency" placeholder="X.XX" format="currency" />

                    <label class="toggle" for="currency-markup">Show Markup</label><input id="currency-markup" type="checkbox"/>
                    <pre>
                        <code>
&lt;label for="currency">Currency&lt;/label>
&lt;FormattedInput id="currency" placeholder="X.XX" format="currency" />
                        </code>
                    </pre>
                </li>
                <li>
                    <label for="currencyInt">Currency Int</label>
                    <FormattedInput id="currencyInt" placeholder="X" format="currencyInt" />

                    <label class="toggle" for="currency-int-markup">Show Markup</label><input id="currency-int-markup" type="checkbox"/>
                    <pre>
                        <code>
&lt;label for="currencyInt">Currency Int&lt;/label>
&lt;FormattedInput id="currencyInt" placeholder="X" format="currencyInt" />
                        </code>
                    </pre>
                </li>
                <li>
                    <label for="percent">Percent</label>
                    <FormattedInput id="percent" placeholder="0.00" format="percent" />

                    <label class="toggle" for="percent-markup">Show Markup</label><input id="percent-markup" type="checkbox"/>
                    <pre>
                        <code>
&lt;label for="percent">Percent&lt;/label>
&lt;FormattedInput id="percent" placeholder="X" format="percentInt" />
                        </code>
                    </pre>
                </li>
                <li class="big">
                    <label for="percentInt">Percent Int</label>
                    <FormattedInput id="percentInt" placeholder="X" format="percentInt" />

                    <label class="toggle" for="percent-int-markup">Show Markup</label><input id="percent-int-markup" type="checkbox"/>
                    <pre>
                        <code>
&lt;label for="percentInt">Percent Int&lt;/label>
&lt;FormattedInput id="percentInt" placeholder="X" format="percentInt" />
                        </code>
                    </pre>
                </li>
            </ul>
        </div>
    </div>
</main>
