const chai = require('chai');
const expect = chai.expect;
const deJunk = require('../dist/index.js');

const isJunk = deJunk.isJunk;
const hasJunk = deJunk.hasJunk;

const conf = require('../package.json')
const fields = require('./fields.json')

describe('Dejunk.isJunk',  () => {

  it('has a version number', () => {
    expect(conf.version).to.exist.and.not.be.null // or undefined?
  });

  it('does not flag various research fields', () => {
    fields.forEach(field => {
      expect(isJunk(field),`[${field}]`).to.be.false;
    });
  });


  it('does not flag some words with less common bigrams', () => {
    ["Unknown", "Weight", "e-book", "Hockey", "Zimbabwe", "Kyrgyz", "Kyrgyzstan", "Uyghur"].forEach(word => {
      expect(isJunk(word), `[${word}]`).to.be.false
    })
  });


  it('does not flag various paper titles', () => {
    [
      "BOYD, M. J. & R. WATSON. 1983. A fossil fish forged by Flint Jack. Geological Curator, 3 (7), 444-446.",
      "Osho International Meditation Resort (Pune, 2000s): Anthropological Analysis of Sannyasin Therapies and the Rajneesh Legacy (Journal of Humanistic Psychology)",
      "Base Catalysis of Chromophore Formation in Arg96 and Glu222 Variants of Green Fluorescent Protein",
      "Hargrove, D.L. and Bryan, V.C. ( 1999, Oct.). Malcolm Knowles would be proud of instructional technologies. 17th ICTE Proceedings,Tampa, FL: 17th ICTE",
      "Problems of Crime and Violence in Europe 1750-2000",
      "Bryan, V.C. (2001, Feb.). Editorial review: Designing an online course. Columbus, OH: Merrill Prentice Hall",
      "‘Legitimate Violence’ in the Prose of Counterinsurgency : an Impossible Necessity?”, Alternatives: Global, Local, Political (Sage), vol 38, n°2, 2013, p. 155-171",
      "»Der gotische Mensch will sehen«. Die Schaufrömmigkeit und ihre Deutungen in der Zeit des Nationalsozialismus",
      "Balderramo D, Cárdenas A. Diagnóstico y tratamiento de las complicaciones biliares asociadas al trasplante hepático. Revista Gen 2013;67(2):111-115",
      "Assessment of the diagnostic potential of Immunocapture-PCR and Immuno-PCR for Citrus Variegated Chlorosis",
      "Gluten-free Diet in Psoriasis Patients with Antibodies to Gliadin Results in Decreased Expression of Tissue Transglutaminase and Fewer Ki67&#x0002B; Cells in the Dermis",
      "Words or deeds? Analysing corporate sustainability strategies in the largest European pulp and paper companies during the 2000s",
      "Effect of Urbanization on the Forest Land Use Change in Alabama: A Discrete Choice Approach",
      "Differential in Vivo Sensitivity to Inhibition of P-glycoprotein Located in Lymphocytes, Testes, and the Blood-Brain Barrier",
      "Psychoanalysis and its role in brain plasticity: much more than a simple bla, bla, bla",
    ].forEach(title => {
      expect(isJunk(title)).to.be.false
    })
  });

  it('flags mashing', () => {
    [ "Asdf", "Y5egrdfvc", "Asdfghjkl", "qwee", "asasasasa", "Asdf", "Asd Asd", "Nawwwwww"
    ].forEach(string => {
      expect(isJunk(string), string).to.be.true
    });
  });

  it('flags unlikely bigrams', () => {
    [
      // "MJA 2008; 188 (4): 209-213",
      // "PEDS20140694 1001..1008",
      "Hkygj,n",
      "LH-ftyy",
      // "4D4U-QSRT-5F76-JBT9-EACE",
      // "Guia-ev-v2",
      // "Bell-pdf"
      ].forEach(string => {
        expect(isJunk(string), string).to.be.true
    });
  });

  it('flags giant spiders posing as humans', () => {
    // # Test data provided by https://xkcd.com/1530/
    expect(isJunk('FJAFJKLDSKF7JKFDJ')).to.be.true
  });

  it('flags missing vowels', () => {
    ["Cvgj", "Gm-Csf", "Cxfd", "Mcnp", "Fbmc", "RT qPCR", "Ppwk 2 ppwk 2"].forEach(string => {
        expect(isJunk(string)).to.be.true
    });
  });

  it('flags bad punctuation', () => {
    ["##@!iran", "-@$Biode", ].forEach(string => {
        expect(isJunk(string), string).to.be.true
    });
  });

  it('flags repeated chars', () => {
    ["Aaaa", "Iiiiiiiii", "Economiaaaaaa", "Engineeeeering", "Sssssaj-75-1-102[1] - Aiken 2011"].forEach(string => {
        expect(isJunk(string), string).to.be.true
    });
  });

  it('flags multi-character repeats', () => {
    ["draft draft draft", "Bla Bla Bla"].forEach(string => {
        expect(isJunk(string)).to.be.true
    });
  });

  it('flags excessive short words', () => {
    [ "t i Qu n l i m h c sinh trung h c ph th ng - Lu n v n n t i t t nghi p",
      "H T M L", "case s t r o k e", "Oresajo et al 15 1"
    ].forEach(string => {
        expect(isJunk(string), string).to.be.true
    });
  });
});

describe('Dejunk.hasJunk',  () => {
    it('Allows up to 20% junk words by default', () => {
        expect(hasJunk('There once was a Moooooooooose with a big Kaboose @%@#**@(@)')).to.be.false
        expect(hasJunk('There alskjdlaskjd was a Moooooooooose with a big Kaboose @%@#**@(@)')).to.be.true
    });
});
