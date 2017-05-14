A modified JS port of [academia-edu/dejunk](https://github.com/academia-edu/dejunk).

Detect keyboard mashing and other junk in your data.

``` javascript

var deJunk = require("dejunk.js")

isJunk('asd asd das as d'); // true


// if you need more info pass true as second parameter
var returnString = true;

deJunk.isJunk('asd asd das as d', returnString); // "asdf_row"

deJunk.isJunk('Hello', returnString); // false


deJunk.hasJunk('There once was a Moooooooooose with a big Kaboose @%@#**@(@)'); // false (20% junk)
deJunk.hasJunk('There aslkdjaslkdj was a Moooooose with a big Kaboose @%@#**@(@)'); // true (30%)

// or set the threshold yourself in the second param. Float representing % between 0 & 1
deJunk.hasJunk('There once was a Moooooooooose with a big Kaboose @%@#**@(@)', 0.1); // true (10% junk)


```

#### To do
- memoize intensive functions
- make whitelisting easier
- provide dist build
- improve docs
