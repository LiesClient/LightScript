/*
  Public
  -> TokenTypes[String -> Int]
  -> toTokenType[Int -> String]
  -> tokenize(src: String) -> Token[]
  -> Token(value: String, type: Int)<value: String, type: Int, loc: Location>
  -> Location(line: Int, column: Int)<line: Int, column: Int>

  Private
  -> KeyWords[String -> Int]
  -> isSkippable(str: Char) -> Bool
  -> hasChar(str: Char) -> Bool
  -> hasInt(str: Char) -> Bool

  Imports
  -> (nothing)
*/

const TokenTypes = {};
const toTokenType = {};

// token types "compiler"
(() => {
  let types = [
    // Literals
    "NumericLiteral",
    "StringLiteral",
    "Identifier",

    // Math
    "OpenParen",
    "CloseParen",
    "BinaryOperator",
    "BooleanOperator",
    "LogicalOperator",

    // Keywords
    "Let",
    "Const",
    "Function",
    "Return",
    "If",
    "While",
    "Struct",
    "Class",
    // "For",

    // Symbols
    "Equals",
    "Not",
    "Comma",
    "OpenBrace",
    "CloseBrace",
    "OpenBracket",
    "CloseBracket",
    "Colon",
    "Semicolon",
    "Dot",

    // Signals
    "EOF", // EndOfFile
  ];

  for (let i = 0; i < types.length; i++) {
    let type = types[i];

    TokenTypes[type] = i;
    toTokenType[i] = type;
  }
})();

const KeyWords = {
  "let": TokenTypes.Let,
  "const": TokenTypes.Const,
  "fn": TokenTypes.Function,
  "return": TokenTypes.Return,
  "if": TokenTypes.If,
  "while": TokenTypes.While,
  "struct": TokenTypes.Struct,
  "class": TokenTypes.Class,
};

class Token {
  value = "";
  type = null;
  loc = new Location();
  
  constructor (value = null, type = -1, loc = this.loc) {
    this.value = value;
    this.type = type;
    this.loc = loc;
  }

  setLoc(loc) {
    this.loc = loc;
    return this;
  }

  toString() {
    return `<${toTokenType[this.type]}: ${this.value}>`;
  }
}

class Location {
  line = 0;
  column = 0;
  
  constructor (line = 0, column = 0) {
    this.line = line;
    this.column = column;
  }

  toString() {
    return "Line: " + this.line + ", Column: " + this.column;
  }
}

function tokenize(sourceCode = "") {
  let tokens = new Array();
  let src = sourceCode.split("");

  let currentLine = 1;
  let currentCol = 0;

  // build tokens char by char
  while (src.length > 0) {
    let char = src[0];
    let loc = new Location(currentLine, currentCol);

    currentCol ++;

    if (char == "\n") {
      currentLine++;
      currentCol = 0;
    }

    if (char == "/" && src[1] == "*") {
      while (true){
        src.shift();
        if (src[0] == "*" && src[1] == "/") break;
      }
      src.shift();
      src.shift();
      continue;
    }

    if (isSkippable(char)) {
      src.shift();
      continue;
    }

    // if token is single character
    let singleCharToken = createSingleCharacterToken(char);

    if (singleCharToken) {
      tokens.push(singleCharToken.setLoc(loc));
      src.shift();
      continue;
    }

    // build string literal
    if (char == "\"") {
      let str = "";

      src.shift();

      while (src.length > 0 && src[0] != "\"") {
        str += src.shift();
      }

      src.shift();

      tokens.push(new Token(str, TokenTypes.StringLiteral).setLoc(loc));
      continue;
    }

    // build number "literal"
    if (hasInt(char)) {
      let num = "";

      while (src.length > 0 && hasInt(src[0])){
        let char = src.shift();
        if (char == "_") continue;
        num += char;
      }

      if (isNaN(num)) {
        throw "Error parsing number literal at " + loc.toString() + ".";
      }

      tokens.push(new Token(num, TokenTypes.NumericLiteral).setLoc(loc));
      continue;
    }

    if (hasChar(char)) {
      let identifier = "";

      while (src.length > 0 && hasChar(src[0]))
        identifier += src.shift();
      let reserved = KeyWords[identifier];

      if (typeof reserved == "number") tokens.push(new Token(identifier, reserved).setLoc(loc));
      else tokens.push(new Token(identifier, TokenTypes.Identifier).setLoc(loc));
      continue;
    }

    throw `Unknown [Char] found: "${src[0]}" at [${loc}].`;
  }

  tokens.push(new Token("EOF", TokenTypes.EOF, new Location(currentLine, currentCol)));
  return tokens;
}

function isSkippable(str) {
  return str == " " || str == "\n" || str == "\t";
}

function hasChar(str) {
  return str.toUpperCase() != str.toLowerCase();
}

function hasInt(str) {
  let code = str.charCodeAt(0); 
  /* doing this manually easy porting/editing */
  return (('0'.charCodeAt(0) <= code) && 
    ('9'.charCodeAt(0) >= code)) || code == '.'.charCodeAt(0) || code == "_".charCodeAt(0);
}

function createSingleCharacterToken(char) {
  if (char == "(") return new Token(char, TokenTypes.OpenParen);
  if (char == ")") return new Token(char, TokenTypes.CloseParen);
  if (char == "{") return new Token(char, TokenTypes.OpenBrace);
  if (char == "}") return new Token(char, TokenTypes.CloseBrace);
  if (char == "[") return new Token(char, TokenTypes.OpenBracket);
  if (char == "]") return new Token(char, TokenTypes.CloseBracket);
  if (char == ",") return new Token(char, TokenTypes.Comma);
  if (char == ".") return new Token(char, TokenTypes.Dot);
  if (char == ":") return new Token(char, TokenTypes.Colon);
  if (char == ";") return new Token(char, TokenTypes.Semicolon);
  if (char == "&" || char == "|") return new Token(char, TokenTypes.BooleanOperator); 
  if (char == "<" || char == ">") return new Token(char, TokenTypes.LogicalOperator);
  if (char == "+" || char == "-" || char == "*" || char == "/" || char == "%")
    return new Token(char, TokenTypes.BinaryOperator);
  if (char == "=") return new Token(char, TokenTypes.Equals);
  if (char == "!") return new Token(char, TokenTypes.Not);
  return false;
}