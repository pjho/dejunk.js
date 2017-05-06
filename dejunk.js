const zip = require('lodash.zip');

const arrFlatten = (arr) => [].concat.apply([], arr);

const strReverse = (str) => str.split('').reverse().join('');


// module Dejunk
  // extend self


// All characters on the middle row of a QWERTY keyboard
const MASH_CHARS = 'ASDFGHJKLasdfghjkl;: ';
const letters = arrFlatten([...'abcdefghijklmnopqrstuvwxyz'].map(letter => [`${letter} `, `${letter}${letter}`]));

// All neighboring key pairs on a QWERTY keyboard, except "er" and "re" which
// each make up >1% of bigrams in our "good" sample, plus each letter repeated or with a space
const qwertyBigrams = ['qw', 'we', 'rt', 'ty', 'yu', 'ui', 'op', 'as', 'sd', 'df', 'fg', 'gh', 'hj',
                 'jk', 'kl', 'zx', 'xd', 'cv', 'vb', 'bn', 'nm', 'qa', 'az', 'ws', 'sx', 'ed',
                 'dc', 'rf', 'fv', 'tg', 'gb', 'yh', 'hn', 'uj', 'jm', 'ik', 'ol']


// CURRENT -> trying to make this logic return the same result.
const  MASH_BIGRAMS = new Set(arrFlatten(letters.concat(qwertyBigrams).map(bigram => [bigram, strReverse(bigram)])))

const mashingBigramFrequencies = _mashingBigramFrequencies();
const corpusBigramFrequencies = require('./bigram_frequencies.json');




function isJunk(str, minAlnumChars=3, whitelistRegexes=[], whiteliststrs=[]) {
  if(str && (whiteliststrs.indexOf(str) > -1 || whitelistRegexes.some(rex => rex.test(str)))) {
    return false;
  }

  if (!str || /^\w+$/.test(str) === false) {
    return true; // not alphanumeric
  }

  const normed = normalizeForComparison(str);

  if (tooFewAlphanumericChars(normed, minAlnumChars)) return true; //:too_short
  if (excessiveSingleCharacterRepeats(str, normed)) return true; //:one_char_repeat
  if (startsWithDisallowedPunctuation(str)) return true; //:starts_with_punct
  if (tooManyShortWords(str)) return true; //:too_many_short_words
  if (threePlusCharsRepeatTwice(str)) return true; //:three_chars_repeat_twice
  if (missingVowels(str, normed)) return true; //:missing_vowels
  if (asdfRowAndSuspicious(str)) return true; //:asdf_row

  const ascii_proportion = [...str].filter(c => c.charCodeAt() < 128).length / str.length

  // The bigrams look like the ones you'd get from keyboard mashing (the probability shouldn't be
  // taken too literally, > 0.25 is almost all mashing in practice on our corpus)
  if (str.length > 1 && ascii_proportion > 0.8) {
    if (probabilityOfKeyboardMashing(str) > 0.25){
      return true // :mashing_bigrams
    }
  }

  // The bigrams don't look like the bigrams in legitimate strs
  if (str.length > 6 && ascii_proportion > 0.8) {

      const corpus_similarity = bigram_similarity_to_corpus(str);



/*
      // The similarity is more accurate for longer strs, and with more ASCII,
      // so increase the value (= lower the threshold) for shorter strs and strs with less ASCII.
      score = corpus_similarity * (1.0/ascii_proportion**2) * (1.0/(1 - Math.exp(-0.1*str.length)))

      if (score < 0.03) {
        return true // :unlikely_bigrams
      }
      else if (score < 0.08 && str !~ /\A([[:upper:]][[:lower:]]+ )*[[:upper:]][[:lower:]]+\z/) {
        // The similarity ignores casing, so instead use a higher threshold if the casing looks wrong
        return true //:unlikely_bigrams
      }
      else if (score < bigram_similarity_to_mashing(str)) {
        return true //:mashing_bigrams
      }
*/
  }

  return false
}

function normalizeForComparison(str) {
  return str.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\d]/g, "")
            // gsub(/\p{Mn}+/, ''.freeze). ?? [ruby] Unicode Mark Nonspacing
            .toLowerCase();
}


// Too short (unless we're dealing with a large alphabet with legitimate single-char words)
// NOTE: removed asian alphabet conditionals
function tooFewAlphanumericChars(normed, minAlnumChars) {
  if (normed.length < minAlnumChars) {
      return true
  }
  return false
}


// One character repeated 5 or more times, or 3 or more times and not an
// acronym, roman numeral, or www
function excessiveSingleCharacterRepeats(str, normed) {

    // if there's only one letter in the str
    if ([...new Set(normed)].length == 1) {
      return true
    }

    if (/([^\s])\1\1/i.test(str)) {
      if (/([^0-9])\1\1\1\1/i.test(normed)) {
        return true
      }

      const punct = /[\s\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]/;
      const words = str.split(punct);

      for(let i=0; i < words.length; i++) {
        if (/([^iw0-9])\1\1/i.test(words[i]) && words[i] !== words[i].toUpperCase()) {
          return true;
        }
      }
    }

    return false
}



// Starting punctuation, except ['"#@]
// Ruby Original: str =~ /\A[[:punct:]]/ && str !~ /\A(\p{Pi}|\p{Ps}|['"¿»’]).+/
function startsWithDisallowedPunctuation(str) {
  const startsWithPunct = /^[\s\u2000-\u206F\u2E00-\u2E7F\\'!"$%&()*+,\-.\/:;<=>?\[\]^_`{|}~]/
  return startsWithPunct.test(str)
}


function tooManyShortWords(str) {

  const words = str.split(' ')
  const short = words.filter( (w) => w.length < 3 ).length

  if (short > 2 && short > 0.75 * words.length) {
    return true
  }

  return false
}

// At least 3 characters repeated at least twice in a row (but only on short
// strs, otherwise there are false positives)
function threePlusCharsRepeatTwice(str) {
  // ruby: /(....*)[[:space:][:punct:]]*\1[[:space:][:punct:]]*\1/
  const regexp = /(....*)[\s\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]*\1[\s\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]*\1/

  return (str.length < 80 && regexp.test(str))
}


// Missing vowels (and doesn't look like acronym, and is ASCII so we can tell)
function missing_vowels(str, normed) {

    if (! [...normed].some(c => c.charCodeAt() >= 128) || str == str.toUpperCase() ) {
      if (/[aeiouy]/i.test(normed)) {
        return true
      }
    }

    return false
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
  // Not sure if I can just leave it in scientific notation
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
           .map(bigram => bigram.replace(/[\d]/g, '0')) // [ruby]  .gsub(/[0-9]/, '0'.freeze) not sure why it needs immutable '0'
            // map { |bigram| bigram.gsub(/[[:space:]]/, ' '.freeze) } // [ruby]. not sure why replace space
}

function mashingProbability(bigram) {
  const f = mashingBigramFrequencies[bigram];
  if (f) {
    return f
  }
  else if (/[a-z]{2}/i.test(bigram)) {
    // 26**2 = 676, so 1 in 2k seems a reasonable probability for an arbitrary two-letter bigram given mashing
    return 0.0005;
  }
  else {
    // An arbitrary (non-ASCII) bigram with mashing is slightly more probable than with legit strs
    return 1e-6;
  }
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

/*
  # Cosine similarity between vector of frequencies of bigrams within str,
  # and vector of frequencies of all bigrams within corpus
  def bigram_similarity_to_corpus(str)
    bigrams = bigrams(str)

    freqs = bigrams.
      each_with_object(Hash.new(0)) { |bigram, counts| counts[bigram] += 1 }.
      each_with_object({}) do |(bigram,count), freqs|
        freqs[bigram] = count.to_f / bigrams.length
      end

    numerator = freqs.
      map{ |bigram, freq| corpus_bigram_frequencies[bigram].to_f * freq }.inject(&:+)
    denominator = corpus_bigram_magnitude * ((freqs.values.map{ |v| v**2 }.inject(&:+)) ** 0.5)

    numerator / denominator
  end
*/

// Cosine similarity between vector of frequencies of bigrams within str,
// and vector of frequencies of all bigrams within corpus
function bigram_similarity_to_corpus(str) {
// @WIP
  const bigrams = _bigrams(str);

  const counts = bigrams.reduce((r, bigram) => {
    r[bigram] = r[bigram] ? r[bigram] + 1 : 1;
    return r;
  }, {});

  const numerator = Object.keys(counts).map(bigram => {
    const freq = counts[bigram] / bigrams.length;
    return (corpusBigramFrequencies[bigram] || 0) * freq
  }).reduce((a, b) => a + b);

  // console.log(freqs);


  // denominator = corpus_bigram_magnitude * ((freqs.values.map{ |v| v**2 }.inject(&:+)) ** 0.5)

  // return numerator / denominator
}





/*


  # Cosine similarity between vector of frequencies of bigrams within str,
  # and vector which assumes all bigrams made of neighboring pairs on the keyboard
  # are equally likely, and no others appear
  def bigram_similarity_to_mashing(str)
    bigrams = bigrams(str)

    freqs = bigrams.
      each_with_object(Hash.new(0)) { |bigram, counts| counts[bigram] += 1 }.
      each_with_object({}) do |(bigram,count), freqs|
        freqs[bigram] = count.to_f / bigrams.length
      end

    numerator = freqs.map{ |bigram, freq| freq * mashingBigramFrequencies[bigram].to_f }.inject(&:+)
    denominator = mashing_bigram_magnitude * ((freqs.values.map{ |v| v**2 }.inject(&:+)) ** 0.5)

    numerator / denominator
  end


  # The Bayesian probability of a str being keyboard mashing, given the
  # probability of each bigram if drawn either from the legit corpus or from
  # mashing, and an a priori probability of mashing.
  #
  # The probability shouldn't be taken too literally, but it's a useful
  # indicator.
  def probability_of_keyboard_mashing(str, apriori_probability_of_mashing: 0.1)
    bigrams = bigrams(str)

    return 0 unless bigrams.present?

    prob_bigrams_given_mashing = bigrams.
      map { |bigram| BigDecimal.new(mashing_probability(bigram).to_s) }.
      inject(&:*)

    prob_bigrams_given_corpus = bigrams.
      map { |bigram| BigDecimal.new(corpus_probability(bigram).to_s) }.
      inject(&:*)

    numerator = prob_bigrams_given_mashing * apriori_probability_of_mashing

    numerator / (numerator + prob_bigrams_given_corpus * (1 - apriori_probability_of_mashing))
  end


  private



  def corpus_bigram_magnitude
    @corpus_bigram_magnitude ||= (corpus_bigram_frequencies.values.map{ |v| v**2 }.inject(&:+)) ** 0.5
  end


  def mashing_bigram_magnitude
    @mashing_bigram_magnitude ||= (mashingBigramFrequencies.values.map{ |v| v**2 }.inject(&:+)) ** 0.5
  end
end
*/


bigram_similarity_to_corpus('hadsjk hk∆j hadsjk sjh7kjé ah-sd');
