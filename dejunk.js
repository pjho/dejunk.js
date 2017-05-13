const zip = require('lodash.zip');

const arrFlatten = (arr) => [].concat.apply([], arr);
const strReverse = (str) => str.split('').reverse().join('');

// All characters on the middle row of a QWERTY keyboard
const MASH_CHARS = 'ASDFGHJKLasdfghjkl;: ';
const  MASH_BIGRAMS = _mashBigrams();

// TODo implement better meomoization. these aren't always needed.
const corpusBigramFrequencies  = require('./bigram_frequencies.json');
const mashingBigramFrequencies = _mashingBigramFrequencies();
const corpusBigramMagnitude  = _corpusBigramMagnitude();
const mashingBigramMagnitude = _mashingBigramMagnitude();

/*
  TODO: if mosts words in a sentence are good we should allow it.
  So. i isJunk == true return the following:
  const words = string.split(' ')
  if (words.length > 5) {
    return (words.filter(junk).length / words.length) > 0.85
  }
*/

function isJunk(inputString, returnStr=false, minAlnumChars=3, whitelistRegexes=[], whiteliststrs=[]) {

  if (typeof inputString !== 'string') {
    throw 'Input string is not a string'
  }

  const str = inputString.trim();
  const normed = normalizeForComparison(str);

  const returnVal = (s, b) => returnStr ? s : b;

  if(str && (whiteliststrs.indexOf(str) > -1 || whitelistRegexes.some(rex => rex.test(str)))) {
    return false;
  }

  if (!str || /[A-z]+/.test(str) === false) {
    return false; //'not_alphanumeric'
  }

  // if it looks like an email address return false
  if(/\b[^ @]+@[^ @\.]+\.[^ ]{2,10}\b/i.test(str)) {
    return false; // email_address
  }

  if(/[A-Z]{2,8}/.test(str)) {
    return false; // acronym
  }

  if (excessiveSingleCharacterRepeats(str, normed)) return returnVal('one_char_repeat', true);
  if (startsWithMultiplePunctuation(str)) return returnVal('starts_with_punct', true);
  if (tooManyShortWords(str)) return returnVal('too_many_short_words', true);
  if (threePlusCharsRepeatTwice(str)) return returnVal('three_chars_repeat_twice', true);
  if (missingVowels(str, normed)) return returnVal('missing_vowels', true);
  if (asdfRowAndSuspicious(str)) return returnVal('asdf_row', true);

  const asciiProportion = [...str].filter(c => c.charCodeAt() < 128).length / str.length;

  // The bigrams look like the ones you'd get from keyboard mashing (the probability shouldn't be
  // taken too literally, > 0.25 is almost all mashing in practice on our corpus)
  if (str.length > 1 && asciiProportion > 0.8) {
    if (probabilityOfKeyboardMashing(str) > 0.99){ // bumped up from 0.25
      return returnVal('mashing_bigrams', true);
    }
  }

  if (str.length > 6 && asciiProportion > 0.8) {

      const corpus_similarity = bigramSimilarityToCorpus(str);

      // The similarity is more accurate for longer strs, and with more ASCII,
      // so increase the value (= lower the threshold) for shorter strs and strs with less ASCII.
      const score = corpus_similarity * (1.0/asciiProportion*asciiProportion) * (1.0/(1 - Math.exp(-0.1*str.length)))

      // The similarity ignores casing, so instead use a higher threshold if the casing looks wrong
      if (score < 0.01 || score < 0.04 && ! /^([A-Z][a-z]+ )*[A-Z][a-z]+$/.test(str)) { // reduced sensitivity
        return returnVal('unlikely_bigrams', true);
      }

      else if (bigramSimilarityToMashing(str) - score > 0.05) {
      // else if (score < bigramSimilarityToMashing(str)) {
        return returnVal('mashing_bigrams', true);
      }
  }

  return false
}

function _mashBigrams() {
  const letters = arrFlatten([...'abcdefghijklmnopqrstuvwxyz'].map(letter => [`${letter} `, `${letter}${letter}`]));

  // All neighboring key pairs on a QWERTY keyboard, except "er" and "re" which
  // each make up >1% of bigrams in our "good" sample, plus each letter repeated or with a space
  const qwertyBigrams = ['qw', 'we', 'rt', 'ty', 'yu', 'ui', 'op', 'as', 'sd', 'df', 'fg', 'gh', 'hj',
                   'jk', 'kl', 'zx', 'xd', 'cv', 'vb', 'bn', 'nm', 'qa', 'az', 'ws', 'sx', 'ed',
                   'dc', 'rf', 'fv', 'tg', 'gb', 'yh', 'hn', 'uj', 'jm', 'ik', 'ol']

  return new Set(arrFlatten(letters.concat(qwertyBigrams).map(bigram => [bigram, strReverse(bigram)])))
}

function normalizeForComparison(str) {
    return str.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\d]/g, "")
            .toLowerCase();
}

// One non numeric character repeated 5 or more times
function excessiveSingleCharacterRepeats(str, normed) {
    return /(\D)\1{4,}/g.test(str)
}

function startsWithMultiplePunctuation(str) {
  return /^([\s\$%&()*+,\-\/:;<=>?\[\]^_{|}~!'"@#¿¡`]{3,}|[.]{4,})/.test(str)
}

function tooManyShortWords(str) {
  const words = str.split(' ')
  if (words.length < 5) { return false; }

  const short = words.filter( (w) => w.length < 3 ).length

  if (short > 2 && short > 0.75 * words.length) {
    return true
  }

  return false
}

// At least 3 characters repeated at least twice in a row (but only on short
// strs, otherwise there are false positives)
function threePlusCharsRepeatTwice(str) {
  return (str.length < 80 && /(....*)[ \-._!@]*\1[ \-._!@]*\1/g.test(str))
}

// Missing vowels (and doesn't look like acronym, and is ASCII so we can tell)
function missingVowels(str, normed) {
    const containsNonAscii = [...normed].some(c => c.charCodeAt() >= 128);
    const isAcronym = str === str.toUpperCase();
    const isNth = /^\d+(?:st|nd|rd|th|)$/.test(str);

    if (containsNonAscii || isAcronym || isNth) {
      return false;
    }

    return !/[aeiouy]/i.test(normed);
}


// All characters from the same row of the keyboard is suspicious, but we
// need additional confirmation
function asdfRowAndSuspicious(str) {
    if ([...str].every(c => MASH_CHARS.indexOf(c) > -1)) {
      if (str.length >= 16) return true;
      if (/(...).*\1/.test(str)) return true; // Three-plus characters, repeated
      if(/(..).*\1.*\1/.test(str)) return true; // Two characters, repeated twice
      if(/\b[sdfghjkl]\b/.test(str)) return true;  // Stray lowercase letter
      if(/[^aeiouy]{3}/i.test(str) && (str.length > 5 || str != str.toUpperCase())) return true; // Three consonants in a row, non-acronym
    }

    return false;
}

// The Bayesian probability of a str being keyboard mashing, given the
// probability of each bigram if drawn either from the legit corpus or from
// mashing, and an a priori probability of mashing.
// The probability shouldn't be taken too literally, but it's a useful indicator.
function probabilityOfKeyboardMashing(str, aprioriProbabilityOfMashing=0.1) {
  const bigrams = _bigrams(str);

  if(!bigrams || bigrams.length == 0) return 0;

  // [todo][ruby] version uses BigDecimal here to use decimal notation of numbers.
  // Not sure if I can just leave it in scientific notation. Might be ok. vals are the same
  const probBigramsGivenMashing = bigrams
    .map(bigram => mashingProbability(bigram))
    .reduce( (x, i) => x * i)

  const probBigramsGivenCorpus = bigrams
    .map(bigram => corpusProbability(bigram))
    .reduce( (x, i) => x * i)

  const numerator = probBigramsGivenMashing * aprioriProbabilityOfMashing;

  return numerator / (numerator + probBigramsGivenCorpus * (1 - aprioriProbabilityOfMashing));
}

function _bigrams(str) {
  str = str.trim()

  if(!str || str.length < 2) { return [] }

  const chars = str.split('');

  return zip(chars, chars.slice(1))
           .filter(x => !!x[0] && !!x[1])
           .map(arr => arr.join('').toLowerCase())
           .map(bigram => bigram.replace(/[\d]/g, '0'))
}

function mashingProbability(bigram) {
  const f = mashingBigramFrequencies[bigram];
  return f || 1e-6;
}


// This is a guess because we don't have a good corpus, but we assume that
// 50% of mashing bigrams are a neighboring pair on the ASDF row or a duplicate
// and the rest are evenly distributed among other neighboring pairs or char plus-space.
function  _mashingBigramFrequencies() {
    const mBF = {};
    MASH_BIGRAMS.forEach((bigram) => {
      if (bigram[0] == bigram[1] || [...bigram].every(c => c !== ' ' && MASH_CHARS.indexOf(c) > -1)) {
        mBF[bigram] = 0.5 / (16 + 26)
      } else {
        mBF[bigram] = 0.5 / (MASH_BIGRAMS.size - 16 - 26)
      }
    });
    return mBF;
}


function corpusProbability(bigram) {

  return corpusBigramFrequencies[bigram] || 1e-7 // Around the smallest frequency we store for the corpus
}


function objMagnitude(obj) {
  return Math.pow(Object.keys(obj).map(x => obj[x] * obj[x]).reduce((r, x) => r + x), 0.5)
}


// Cosine similarity between vector of frequencies of bigrams within str,
// and vector of frequencies of all bigrams within corpus
function bigramSimilarityToCorpus(str) {
  const bigrams = _bigrams(str);

  const counts = bigrams.reduce((r, bigram) => {
    r[bigram] = r[bigram] ? r[bigram] + 1 : 1;
    return r;
  }, {});

  const freqs = Object.keys(counts).reduce((r, bigram) => {
    r[bigram] = counts[bigram] / bigrams.length;
    return r;
  }, {});

  const numerator = Object.keys(counts).map(bigram => {
    return (corpusBigramFrequencies[bigram] || 0) * freqs[bigram]
  }).reduce((a, b) => a + b);

  const denominator = corpusBigramMagnitude * objMagnitude(freqs);

  return numerator / denominator
}


function _corpusBigramMagnitude() {

  return objMagnitude(corpusBigramFrequencies)
}


// Cosine similarity between vector of frequencies of bigrams within str,
// and vector which assumes all bigrams made of neighboring pairs on the keyboard
// are equally likely, and no others appear
function bigramSimilarityToMashing(str) {

  const bigrams = _bigrams(str);

  const counts = bigrams.reduce((r, bigram) => {
    r[bigram] = r[bigram] ? r[bigram] + 1 : 1;
    return r;
  }, {});

  const freqs = Object.keys(counts).reduce((r, bigram) => {
    r[bigram] = counts[bigram] / bigrams.length;
    return r;
  }, {});

  const numerator = Object.keys(freqs).map(bigram => {
    return (mashingBigramFrequencies[bigram] || 0) * freqs[bigram]
  }).reduce((a, b) => a + b);

  const denominator = mashingBigramMagnitude * objMagnitude(freqs);

  return numerator / denominator;
}

function _mashingBigramMagnitude() {
  return objMagnitude(mashingBigramFrequencies);
}

module.exports = {
  isJunk: isJunk
}
