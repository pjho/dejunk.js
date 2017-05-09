### Work in Progress

A JS port of [academia-edu/dejunk](https://github.com/academia-edu/dejunk).



``` javascript

var isJunk = require("dejunk.js").isJunk

isJunk('asd asd das as d'); // true

var returnString = true;

isJunk('asd asd das as d', returnString); // "asdf_row"

isJunk('Hello', returnString); // false

```
