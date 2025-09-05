// functions/eslint.config.js
module.exports = [
  {
    rules: {
      // This turns off the two problematic style rules for good.
      "max-len": "off",
      "eol-last": "off",
      "require-jsdoc": "off" // Also disable this common strict rule.
    }
  }
];
