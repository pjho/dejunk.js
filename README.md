A modified JS port of [academia-edu/dejunk](https://github.com/academia-edu/dejunk).

Detect keyboard mashing and other junk in your data.

Uses a variety of heuristics, the most sophisticated being a comparison of bigrams in the input to the frequencies in a "known-good" corpus vs. their proximity on a keyboard. Achieves pretty good precision on Academia.edu's data, but might need adjustment for yours.


``` javascript

var isJunk = require("dejunk.js").isJunk

isJunk('asd asd das as d'); // true


// if you need more info pass true as second parameter
var returnString = true;

isJunk('asd asd das as d', returnString); // "asdf_row"

isJunk('Hello', returnString); // false

```

#### To do
- memoize intensive functions
- make whitelisting easier
- provide dist build
- improve docs
