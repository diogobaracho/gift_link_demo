/**
 * Minimal typings for the parts of `natural` this service uses.
 *
 * `natural` publishes raw `.ts` sources that do not compile under this repo's strict
 * settings (`verbatimModuleSyntax`), and `skipLibCheck` does not skip `.ts` files.
 * tsconfig `paths` maps the module here instead. The runtime is still the real package.
 */
declare module 'natural' {
  interface Stemmer {
    stem(token: string): string;
  }

  interface SentimentAnalyzer {
    getSentiment(words: string[]): number;
  }

  interface WordTokenizer {
    tokenize(text: string): string[];
  }

  const natural: {
    SentimentAnalyzer: new (
      language: 'English',
      stemmer: Stemmer | null,
      vocabularyType: 'afinn' | 'senticon' | 'pattern',
    ) => SentimentAnalyzer;
    WordTokenizer: new () => WordTokenizer;
    PorterStemmer: Stemmer;
  };
  export default natural;
}
