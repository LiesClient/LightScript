/*
  Public
  -> Parser () {
    parse(tokens: Token[]) -> Program
  }

  Private
  << TODO: document private functions >>

  Imports
  * from "./ast.js"
  (tokenize, TokenTypes, toTokenType) from "./lexer.js"
*/

class Parser {
  tokens = [];
  program = new Program();

  // eof -> END_OF_FILE
  is_eof() {
    return this.tokens[0].type == TokenTypes.EOF;
  }

  at() {
    return this.tokens[0];
  }

  next() {
    return this.tokens[1];
  }

  eat() {
    let token = this.tokens.shift();
    if (token.type == TokenTypes.EOF) {
      throw("Attempt to eat EOF (check end of file for something weird).");
    }
    return token;
  }

  expect(type) {
    let token = this.eat();

    if (token.type != type) {
      this.parserError(`Expected ${toTokenType[type]}, got ${token.toString()}`);
    }

    return token;
  }

  softExpect(type) {
    let token = this.eat();

    if (token.type != type) {
      return false;
    }

    return token;
  }

  contructor() {}

  parse (tokens = []) {
    this.tokens = tokens;
    this.program = new Program();

    while(!this.is_eof()){
      try {
        this.program.body.push(...this.parseStatement());
      } catch (e) {
        if (e.lsCaught) throw e.err;
        else {
          console.log(e);
          throw "Parser Error: " + e;
        }
      }
    }

    return this.program;
  }

  parseStatement() {
    let type = this.at().type;

    if (type == TokenTypes.Semicolon) {
      this.expect(TokenTypes.Semicolon);
      return this.parseStatement();
    }

    if (type == TokenTypes.Class) {
      return [this.parseClassDeclaration()];
    }

    if (type == TokenTypes.Struct) {
      return [this.parseStructDeclaration()];
    }

    if (type == TokenTypes.Let || type == TokenTypes.Const) {
      return this.parseVariableDeclaration(this.eat());
    }

    if (type == TokenTypes.For || type == TokenTypes.While) {
      return [this.parseLoopStatement(this.eat())];
    }

    if (type == TokenTypes.Function) {
      return [this.parseFunctionDeclaration()];
    }

    if (type == TokenTypes.Return) {
      this.expect(TokenTypes.Return);

      // are we returning a value?
      if (this.at().type == TokenTypes.CloseBrace)
        return [new ReturnStatement(new Identifier("null"))]
      return [new ReturnStatement(this.parseExpression())];
    }

    if (type == TokenTypes.If) {
      return [this.parseIfStatement()];
    }

    return [this.parseExpression()];
  }

  parseStructDeclaration() {
    this.expect(TokenTypes.Struct);
    let identifier = new Identifier(this.expect(TokenTypes.Identifier).value);
    this.expect(TokenTypes.OpenBrace);
    let fields = [];

    while (this.at().type != TokenTypes.CloseBrace && !this.is_eof()) {
      let fieldName = this.expect(TokenTypes.Identifier).value;
      this.expect(TokenTypes.Colon);
      let fieldType = this.expect(TokenTypes.Identifier).value;
      fields.push(new Field(fieldName, fieldType));
    }

    if (fields.length == 0) {
      throw("Expected field in Struct " + identifier.symbol.value);
    }

    this.expect(TokenTypes.CloseBrace);
    return new StructDeclaration(identifier, fields);
  }

  parseLoopStatement(keyword) {
    if (keyword.type == TokenTypes.While) {
      this.expect(TokenTypes.OpenParen);
      let test = this.parseExpression();
      this.expect(TokenTypes.CloseParen);
      let body = this.parseBlock();
      return new WhileLoop(test, body);
    } 

    this.parserError("For loops are not yet supported");
    
    // else {
    //   this.expect(TokenTypes.For);
    //   this.expect(TokenTypes.OpenParen);
    //   let declarator = this.parseVariableDeclaration(this.eat());

    //   return new Value();
    // }
  }

  parseIfStatement() {
    this.expect(TokenTypes.If);
    this.expect(TokenTypes.OpenParen);
    let test = this.parseExpression();
    this.expect(TokenTypes.CloseParen);

    let consequent = this.parseBlock();

    return new IfStatement(test, consequent);
  }

  parseVariableDeclaration(keyword) {
    let isConstant = keyword.type == TokenTypes.Const;
    let identifier = new Identifier(this.expect(TokenTypes.Identifier).value);
    let declarations = [];

    // does the declaration also have a value?
    if (this.at().type == TokenTypes.Equals) {
      this.expect(TokenTypes.Equals);
      let rightHand = this.parseExpression();
      declarations.push(new VariableDeclaration(identifier, isConstant, rightHand));
    } else {
      declarations.push(new VariableDeclaration(identifier, isConstant, new Identifier("null")));
    }

    if (this.at().type == TokenTypes.Comma) { // let x = 2, y = 4;
      this.expect(TokenTypes.Comma);
      declarations.push(...this.parseVariableDeclaration(keyword));
    }

    return declarations;
  }

  parseFunctionDeclaration() {
    this.expect(TokenTypes.Function);
    let name = new Identifier(this.expect(TokenTypes.Identifier).value);
    this.expect(TokenTypes.OpenParen);
    // fn name ( <= we are here
    let next = this.at();
    // next = argument or close paren
    if (next.type == TokenTypes.CloseParen) {
      this.expect(TokenTypes.CloseParen);
      return new FunctionDeclaration(name, [], this.parseBlock());
    }

    let functionArguments = [];

    while (this.at().type != TokenTypes.CloseParen && !this.is_eof()) {
      let identifier = this.expect(TokenTypes.Identifier);
      functionArguments.push(new Identifier(identifier.value));
      let next = this.at();

      if (next.type == TokenTypes.Comma)
        this.expect(TokenTypes.Comma);
    }

    this.expect(TokenTypes.CloseParen);

    return new FunctionDeclaration(name, functionArguments, this.parseBlock());
  }

  parseBlock () {
    let statements = [];

    this.expect(TokenTypes.OpenBrace);
    while (this.at().type != TokenTypes.CloseBrace && !this.is_eof()) {
      let statement = this.parseStatement();
      statements.push(...statement);
    }

    this.expect(TokenTypes.CloseBrace);
    return statements;
  }

  parseExpression() {
    return this.parseNotExpression();
  }

  parseNotExpression() {
    if (this.at().type != TokenTypes.Not) return this.parseLogicalExpression();

    this.expect(TokenTypes.Not);

    let right = this.parseExpression();

    return new NotExpression(right);
  }

  parseLogicalExpression() {
    let left = this.parseBooleanExpression();

    if (this.at().type == TokenTypes.LogicalOperator) {
      let operator = this.expect(TokenTypes.LogicalOperator).value;
      let equals = false;

      if (this.at().type == TokenTypes.Equals) {
        equals = true;
        this.softExpect(TokenTypes.Equals);
      }

      let right = this.parseExpression();
      return new LogicalExpression(left, operator, equals, right);
    }

    if (this.at().type == TokenTypes.Equals && this.next().type == TokenTypes.Equals) {
      let operator = this.expect(TokenTypes.Equals).value;
      let equals = true;

      this.expect(TokenTypes.Equals);

      let right = this.parseExpression();

      return new LogicalExpression(left, operator, equals, right);
    }

    if (this.at().type == TokenTypes.Not && this.next().type == TokenTypes.Equals) {
      let operator = this.expect(TokenTypes.Not).value;
      let equals = true;

      this.expect(TokenTypes.Equals);

      let right = this.parseExpression();

      return new LogicalExpression(left, operator, equals, right);
    }

    return left;
  }

  parseBooleanExpression() {
    let left = this.parseAssignmentExpression();

    if (this.at().type == TokenTypes.BooleanOperator) {
      let operator = this.expect(TokenTypes.BooleanOperator).value;
      let next = this.expect(TokenTypes.BooleanOperator).value;
      if (operator != next) {
        this.parserError("Boolean Operator's double is different or missing. (Boolean operators are && and || not &|)");
      }
      let right = this.parseExpression();
      return new BooleanExpression(left, operator, right);
    }

    return left;
  }

  parseAssignmentExpression() {
    let left = this.parseArrayExpression();

    if (this.at().type == TokenTypes.Equals && this.next().type != TokenTypes.Equals) {
      this.expect(TokenTypes.Equals);
      let value = this.parseAssignmentExpression();
      return new VariableAssignment(left, value);
    }

    return left;
  }

  parseArrayExpression() {
    if (this.at().type != TokenTypes.OpenBracket) return this.parseObjectExpression();
    this.expect(TokenTypes.OpenBracket);

    let values = [];

    while (!this.is_eof() && this.at().type != TokenTypes.CloseBracket) {
      let value = this.parseExpression();
      values.push(value);

      let next = this.at();

      if (next.type == TokenTypes.Comma) {
        this.expect(TokenTypes.Comma);
        continue;
      } else break;
    }

    if(!this.softExpect(TokenTypes.CloseBracket)){
      this.parserError("Expected CloseBracket for ArrayLiteral.");
    }

    return new ArrayLiteral(values);
  }

  parseObjectExpression() {
    if (this.at().type != TokenTypes.OpenBrace) return this.parseAdditiveExpression();
    this.expect(TokenTypes.OpenBrace);

    let properties = [];

    while (!this.is_eof() && this.at().type != TokenTypes.CloseBrace) {
      let key = new Identifier(this.expect(TokenTypes.Identifier).value);
      let next = this.at().type;

      // no value aka { key, ... }
      if (next == TokenTypes.Comma) {
        this.eat(); // eat comma
        properties.push(new Property(key, undefined));
        continue;
      }

      // no value or comma aka { key }
      if (next == TokenTypes.CloseBrace) {
        properties.push(new Property(key, undefined));
        continue;
      }

      this.expect(TokenTypes.Colon);

      let value = this.parseExpression();
      properties.push(new Property(key, value));
      if (this.at().type != TokenTypes.CloseBrace) {
        this.expect(TokenTypes.Comma);
      }
    }

    if(!this.softExpect(TokenTypes.CloseBrace)){
      this.parserError("Expected CloseBrace for ObjectLiteral.");
    }

    return new ObjectLiteral(properties);
  }

  parseAdditiveExpression() {
    let left = this.parseMultiplicativeExpression();

    while (this.at().value == "+" || this.at().value == "-") {
      let operator = this.expect(TokenTypes.BinaryOperator).value;
      let right = this.parseMultiplicativeExpression();
      left = new BinaryExpression(left, operator, right);
    }

    return left;
  }

  parseMultiplicativeExpression() {
    let left = this.parseComplexExpression();
    // parseComplex is specifically properties and functions

    while (
      this.at().value == "/" || this.at().value == "*" || this.at().value == "%"
    ) {
      let operator = this.expect(TokenTypes.BinaryOperator).value;
      let right = this.parseComplexExpression();
      left = new BinaryExpression(left, operator, right);
    }

    return left;
  }

  parseComplexExpression() {
    let member = this.parseMemberExpression();

    if (this.at().type == TokenTypes.OpenParen) {
      return this.parseCallExpression(member);
    }

    return member;
  }

  parseCallExpression(caller) {
    let callExpression = new FunctionCall(caller, this.parseArguments());

    if (this.at().type == TokenTypes.OpenParen) {
      callExpression = this.parseCallExpression(callExpression);
    }

    return callExpression;
  }

  parseArguments() {
    this.expect(TokenTypes.OpenParen);

    if (this.at().type == TokenTypes.CloseParen) {
      this.expect(TokenTypes.CloseParen);
      return [];
    }

    // print (1 + 2 - 3, 8)

    let args = [this.parseExpression()];

    while (this.at().type == TokenTypes.Comma) {
      this.expect(TokenTypes.Comma);
      args.push(this.parseExpression());
    }

    this.expect(TokenTypes.CloseParen);

    return args;
  }

  parseMemberExpression() {
    let object = this.parseSimpleExpression();

    while (this.at().type == TokenTypes.Dot || this.at().type == TokenTypes.OpenBracket) {
      let operator = this.eat();
      let property;
      let computed;

      if (operator.type == TokenTypes.Dot) {
        computed = false;
        property = this.parseSimpleExpression();

        if (property.type != NodeTypes.Identifier) {
          this.parserError("Dot operator in member expression requires an identifier.");
        }
      }

      // open bracket
      else {
        computed = true;
        property = this.parseExpression();
        // we already ate operator (bracket)
        // and property
        this.expect(TokenTypes.CloseBracket);
      }

      object = new ObjectMember(object, property, computed);
    }

    if (this.at().type == TokenTypes.Equals && this.next().type != TokenTypes.Equals) {
      // assignment
      this.expect(TokenTypes.Equals);
      let value = this.parseExpression();

      if (object.type == NodeTypes.Identifier) {
        return new VariableAssignment(object, value);
      } else object.assignment = value;
    }

    return object;
  }

  parseSimpleExpression() {
    let type = this.at().type;

    if (type == TokenTypes.Identifier)
      return new Identifier(this.expect(TokenTypes.Identifier).value);
    if (type == TokenTypes.NumericLiteral)
      return new NumericLiteral(parseFloat(this.expect(TokenTypes.NumericLiteral).value));
    if (type == TokenTypes.StringLiteral)
      return new StringLiteral(this.expect(TokenTypes.StringLiteral).value);

    if (type == TokenTypes.OpenParen){
      this.expect(TokenTypes.OpenParen);
      let value = this.parseExpression();
      let token = this.eat();

      // if token => CloseParen, we just parsed a group
      // if token => Comma, we just parsed an argument to a function call
      // (the latter will then throw an error)

      if (token.type == TokenTypes.CloseParen) {
        return value;
      }
    }

    console.trace();
    this.parserError(`Unexpected token: <${toTokenType[this.at().type]}: ${this.at().value}>`);
  }

  parserError(err = "") {
    throw {
      err: "Parser Error at: [" + this.at().loc.toString() + "]" + ("\n" + err),
      lsCaught: true
    }
  }
}