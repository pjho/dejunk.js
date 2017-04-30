const arrFlatten = (arr) => [].concat.apply([], arr);

const strReverse = (str) => str.split('').reverse().join('');


// module Dejunk
  // extend self


// All characters on the middle row of a QWERTY keyboard
const MASH_CHARS = 'ASDFGHJKLasdfghjkl;: ';
const letters = [...'abcdefghijklmnopqrstuvwxyz'];

// All neighboring key pairs on a QWERTY keyboard, except "er" and "re" which
// each make up >1% of bigrams in our "good" sample, plus each letter repeated or with a space
const bigrams = ['qw', 'we', 'rt', 'ty', 'yu', 'ui', 'op', 'as', 'sd', 'df', 'fg', 'gh', 'hj',
                 'jk', 'kl', 'zx', 'xd', 'cv', 'vb', 'bn', 'nm', 'qa', 'az', 'ws', 'sx', 'ed',
                 'dc', 'rf', 'fv', 'tg', 'gb', 'yh', 'hn', 'uj', 'jm', 'ik', 'ol']


const  MASH_BIGRAMS = arrFlatten(letters.map(letter => [`${letter} `, `${letter}${letter}`]))
                      .concat(arrFlatten(bigrams.map(bigram => [bigram, strReverse(bigram)])))
                      // .to_set.freeze


function isJunk(str, minAlnumChars=3, whitelistRegexes=[], whitelistStrings=[]) {
  if(str && (whitelistStrings.indexOf(string) > -1 || whitelistRegexes.some(rex => rex.test(str)) ) {
    return false;
  }

  if (!str || /^\w+$/.test(str) === false) {
    return false; // not alphanumeric
  }

  const normed = normalizeForComparison(string);


  if (tooFewAlphanumericChars(normed, minAlnumChars)) {
    return false; //:too_short
  }

  if (excessiveSingleCharacterRepeats(str, normed)) {
    return false; //:one_char_repeat
  }


  if (startsWithDisallowedPunctuation(string)) {
    return false; //:starts_with_punct
  }

  if (tooManyShortWords(string)) {
    return false; //:too_many_short_words
  }

  if (threePlusCharsRepeatTwice(string)) {
    return false; //:three_chars_repeat_twice
  }

/*


  if (string =~ /\bfuck/i) {
    return false; //:fuck
  }

  if (missing_vowels?(string, normed)) {
    return false; //:missing_vowels
  }

  if (asdf_row_and_suspicious?(string)) {
    return false; //:asdf_row
  }
*/








}



function normalizeForComparison(str) {
  return str.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\d]/g, "")
            // gsub(/\p{Mn}+/, ''.freeze). ?? RubyUnicode Mark Nonspacing
            .toLowerCase()
}


function tooFewAlphanumericChars(normed, minAlnumChars) {
  // Too short (unless we're dealing with a large alphabet with legitimate single-char words)
  // NOTE: removed asian alphabet conditionals
  //
  if (normed.length < minAlnumChars) {
      return true
  }
  return false
}

// One character repeated 5 or more times, or 3 or more times and not an
// acronym, roman numeral, or www
function excessiveSingleCharacterRepeats(string, normed) {

    // if there's only one letter in the string
    if ([...new Set(normed)].length == 1) {
      return true
    }

    if (/([^\s])\1\1/i.test(string)) {
      if (/([^0-9])\1\1\1\1/i.test(normed)) {
        return true
      }

      const punct = /[\s\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]/;
      const words = string.split(punct);

      for(let i=0; i < words.length; i++) {
        if (/([^iw0-9])\1\1/i.test(words[i] && words[i] ! == words[i].toUpperCase())) {
          return true;
        }
      }
    }

    return false
}



// Starting punctuation, except ['"#@]
// Ruby Original: string =~ /\A[[:punct:]]/ && string !~ /\A(\p{Pi}|\p{Ps}|['"¿»’]).+/
function startsWithDisallowedPunctuation(str) {
  const startsWithPunct = /^[\s\u2000-\u206F\u2E00-\u2E7F\\'!"$%&()*+,\-.\/:;<=>?\[\]^_`{|}~]/
  return startsWithPunct.test(str)
}


function tooManyShortWords(string) {

  const words = string.split(' ')
  const short = words.filter( (w) => w.length < 3 ).length

  if (short > 2 && short > 0.75 * words.length) {
    return true
  }

  return false
}

  // def three_plus_chars_repeat_twice?(string)
  //   string.length < 80 && string =~ /(....*)[[:space:][:punct:]]*\1[[:space:][:punct:]]*\1/
  // end

function threePlusCharsRepeatTwice(str) {
  // At least 3 characters repeated at least twice in a row (but only on short
  // strings, otherwise there are false positives)
  // ruby: /(....*)[[:space:][:punct:]]*\1[[:space:][:punct:]]*\1/
  const regexp = /(....*)[\s\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]*\1[\s\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]*\1/

  return (str.length < 80 && regexp.test(str))
}



/*

    ascii_proportion = string.chars.count { |c| c.ord < 128 }.to_f / string.length

    # The bigrams look like the ones you'd get from keyboard mashing
    # (the probability shouldn't be taken too literally, > 0.25 is almost all
    # mashing in practice on our corpus)
    if string.length > 1 && ascii_proportion > 0.8
      if probability_of_keyboard_mashing(string) > 0.25
        return :mashing_bigrams
      end
    end

    # The bigrams don't look like the bigrams in legitimate strings
    if string.length > 6 && ascii_proportion > 0.8
      corpus_similarity = bigram_similarity_to_corpus(string)

      # The similarity is more accurate for longer strings, and with more ASCII,
      # so increase the value (= lower the threshold) for shorter strings and
      # strings with less ASCII.
      score = corpus_similarity * (1.0/ascii_proportion**2) * (1.0/(1 - Math.exp(-0.1*string.length)))

      if score < 0.03
        return :unlikely_bigrams
      elsif score < 0.08 && string !~ /\A([[:upper:]][[:lower:]]+ )*[[:upper:]][[:lower:]]+\z/
        # The similarity ignores casing, so instead use a higher threshold if
        # the casing looks wrong
        return :unlikely_bigrams
      elsif score < bigram_similarity_to_mashing(string)
        return :mashing_bigrams
      end
    end

    false
 And

C# Cosine similarity between vector of frequencies of bigrams within string,
  # and vector of frequencies of all bigrams within corpus
  def bigram_similarity_to_corpus(string)
    bigrams = bigrams(string)

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

  # Cosine similarity between vector of frequencies of bigrams within string,
  # and vector which assumes all bigrams made of neighboring pairs on the keyboard
  # are equally likely, and no others appear
  def bigram_similarity_to_mashing(string)
    bigrams = bigrams(string)

    freqs = bigrams.
      each_with_object(Hash.new(0)) { |bigram, counts| counts[bigram] += 1 }.
      each_with_object({}) do |(bigram,count), freqs|
        freqs[bigram] = count.to_f / bigrams.length
      end

    numerator = freqs.map{ |bigram, freq| freq * mashing_bigram_frequencies[bigram].to_f }.inject(&:+)
    denominator = mashing_bigram_magnitude * ((freqs.values.map{ |v| v**2 }.inject(&:+)) ** 0.5)

    numerator / denominator
  end

  def bigrams(string)
    return [] if string.nil?

    string = string.strip
    return [] if string.length < 2

    string.
      chars.
      zip(string.chars[1..-1]).
      map { |c1,c2| "#{c1.mb_chars.downcase}#{c2.mb_chars.downcase}" if c1 && c2 }.
      compact.
      map { |bigram| bigram.gsub(/[0-9]/, '0'.freeze) }.
      map { |bigram| bigram.gsub(/[[:space:]]/, ' '.freeze) }
  end

  # The Bayesian probability of a string being keyboard mashing, given the
  # probability of each bigram if drawn either from the legit corpus or from
  # mashing, and an a priori probability of mashing.
  #
  # The probability shouldn't be taken too literally, but it's a useful
  # indicator.
  def probability_of_keyboard_mashing(string, apriori_probability_of_mashing: 0.1)
    bigrams = bigrams(string)

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

  def missing_vowels?(string, normed)
    # Missing vowels (and doesn't look like acronym, and is ASCII so we can tell)
    unless normed.chars.any? { |c| c.ord >= 128 } || string == string.upcase
      return true if normed !~ /[aeiouy]/i
    end

    false
  end




  def asdf_row_and_suspicious?(string)
    # All characters from the same row of the keyboard is suspicious, but we
    # need additional confirmation
    if string.chars.all? { |c| MASH_CHARS.include?(c) }
      return true if string.length >= 16
      return true if string =~ /(...).*\1/ # Three-plus characters, repeated
      return true if string =~ /(..).*\1.*\1/ # Two characters, repeated twice
      return true if string =~ /\b[sdfghjkl]\b/ # Stray lowercase letter
      return true if string =~ /[^aeiouy]{3}/i && (string.length > 5 || string != string.upcase) # Three consonants in a row, non-acronym
    end

    false
  end



  def mashing_probability(bigram)
    if (f = mashing_bigram_frequencies[bigram])
      f
    elsif f =~ /[a-z]{2}/i
      # 26**2 = 676, so 1 in 2k seems a reasonable probability for an arbitrary two-letter bigram given mashing
      0.0005
    else
      # An arbitrary (non-ASCII) bigram with mashing is slightly more probable than with legit strings
      1e-6
    end
  end

  def corpus_probability(bigram)
    corpus_bigram_frequencies[bigram] || 1e-7 # Around the smallest frequency we store for the corpus
  end

  def corpus_bigram_frequencies
    @corpus_bigram_frequencies ||= YAML.load_file(File.expand_path('../../resources/bigram_frequencies.yml', __FILE__)).freeze
  end

  def corpus_bigram_magnitude
    @corpus_bigram_magnitude ||= (corpus_bigram_frequencies.values.map{ |v| v**2 }.inject(&:+)) ** 0.5
  end

  def mashing_bigram_frequencies
    # This is a guess because we don't have a good corpus, but we assume that
    # 50% of mashing bigrams are a neighboring pair on the ASDF row or a duplicate
    # and the rest are evenly distributed among other neighboring pairs or char-
    # plus-space.
    @mashing_bigram_frequencies ||= MASH_BIGRAMS.each_with_object({}) do |bigram, freqs|
      if bigram.first == bigram.last || bigram.chars.all? { |c| c != ' '.freeze && MASH_CHARS.include?(c) }
        freqs[bigram] = 0.5 / (16 + 26)
      else
        freqs[bigram] = 0.5 / (MASH_BIGRAMS.length - 16 - 26)
      end
    end
  end

  def mashing_bigram_magnitude
    @mashing_bigram_magnitude ||= (mashing_bigram_frequencies.values.map{ |v| v**2 }.inject(&:+)) ** 0.5
  end
end
*/
