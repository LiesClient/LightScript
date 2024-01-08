/*
  Public
  -> NodeTypes[String -> Int]
  -> toNodeType[Int -> String]

  -> Program*[Statement]()<type = NodeTypes.Program: Int, body: Statement[]>
  -> StructDeclaration*[Statement](identifier: Identifier, fields: Field[])<type = NodeTypes.StructDeclaration: Int>
  -> FunctionDeclaration*[Statement](identifier: Identifier, parameters: Identifier[], body: Statement[])<type = NodeTypes.FunctionDeclaration: Int>
  -> ReturnStatement*[Statement](expression: Expression)<type = NodeTypes.ReturnStatement: Int>
  -> IfStatement*[Statement](test: Expression, consequent: Statement[])<type = NodeTypes.IfStatement: Int>
  -> WhileLoop*[Statement](test: Expression, body: Statement[])<type = NodeTypes.WhileLoop: Int>
  -> VariableDeclaration*[Statement](identifier: Identifier, isConstant: Bool = false, right: Expression)<type = NodeTypes.VariableDeclaration: Int>
  -> VariableAssignment*[Expression](identifier: Identifier, right: Expression)<type = NodeTypes.VariableAssignment: Int>
  -> FunctionCall*[Expression](caller: Expression, arguments: Expression[])<type = NodeTypes.FunctionCall: Int>
  -> ObjectMember*[Expression](object: Expression, member: Identifier, computed: Boolean = false)<type = NodeTypes.ObjectMember: Int>
  -> BooleanExpression*[Expression](left: Expression, operator: String, right: Expression)<type = NodeTypes.BooleanExpression: Int>
  -> BinaryExpression*[Expression](left: Expression, operator: String, right: Expression)<type = NodeTypes.BinaryExpression: Int>
  -> LogicalExpression*[Expression](left: Expression, operator: String, equals: Bool, right: Expression)<type = NodeTypes.LogicalExpression: Int>
  -> NotExpression*[Expression](expression: Expression)<type = NodeTypes.NotExpression: Int>
  -> NumericLiteral*[Expression](value: Number)<type = NodeTypes.NumericLiteral: Int>
  -> StringLiteral*[Expression](value: String)<type = NodeTypes.StringLiteral: Int>
  -> ArrayLiteral*[Expression](value: Expression[])<type = NodeTypes.ArrayLiteral: Int>
  -> ObjectLiteral*[Expression](properties: Property[])<type = NodeTypes.ObjectLiteral: Int>
  -> Identifier*[Expression](symbol: String)<type = NodeTypes.Identifier: Int>
  
  Private
  -> Statement()<type: Int>
  -> Expression[Statement>()<type: Int>
  -> Field(name: Identifier, value: Identifier)<name: Identifier, value: Identifier>
  -> Property(key: String, value?: Expression)<key: String, value?: Expression>

  Note: The reason for Statement/Expression is to detail the difference between a statement and an expression.
  Specifically, a statement does not resolve to a value, but an expression does.
  
  Imports
  -> (nothing)
*/

const NodeTypes = {};
const toNodeType = {};

// node types "compiler"
(() => {
  let types = [
    "Program",
    "VariableDeclaration",
    "VariableAssignment",
    "NumericLiteral",
    "StringLiteral",
    "ArrayLiteral",
    "Property",
    "ObjectMember",
    "FunctionCall",
    "ObjectLiteral",
    "Identifier",
    "BinaryExpression",
    "BooleanExpression",
    "LogicalExpression",
    "NotExpression",
    "ReturnStatement",
    "IfStatement",
    "FunctionDeclaration",
    "WhileLoop",
    "StructDeclaration",
    "ClassDeclaration",
  ];

  for (let i = 0; i < types.length; i++) {
    let type = types[i];

    NodeTypes[type] = i;
    toNodeType[i] = type;
  }
})();

class Statement {
  type = null;
  constructor() { }
}

class Expression extends Statement {
  type = null;
  constructor() { super() }
}

class Field {
  name;
  type;

  constructor(name, type) {
    this.name = name;
    this.type = type;
  }
}

class Property {
  key = "";
  value; // expression or null

  constructor(key, value) {
    this.key = key;
    this.value = value;
  }
}

class Program extends Statement {
  type = NodeTypes.Program;
  body = []; // statement array
  constructor() { super() }
}

class StructDeclaration extends Statement {
  type = NodeTypes.StructDeclaration;
  fields = [];
  identifier;

  constructor(identifier, fields) {
    super();
    this.identifier = identifier;
    this.fields = fields;
  }
}

class FunctionDeclaration extends Statement {
  type = NodeTypes.FunctionDeclaration;
  identifier;
  parameters = [];
  body = [];

  constructor(identifier, parameters, body) {
    super();
    this.identifier = identifier;
    this.parameters = parameters;
    this.body = body;
  }
}

class ReturnStatement extends Statement {
  type = NodeTypes.ReturnStatement;
  expression;

  constructor(expression) {
    super();
    this.expression = expression;
  }
}

class IfStatement extends Statement {
  type = NodeTypes.IfStatement;
  test;
  consequent;

  constructor(test, consequent) {
    super();
    this.test = test;
    this.consequent = consequent;
  }
}

class WhileLoop extends Statement {
  type = NodeTypes.WhileLoop;
  test;
  body = [];

  constructor(test, body) {
    super();
    this.test = test;
    this.body = body;
  }
}

class VariableDeclaration extends Statement {
  type = NodeTypes.VariableDeclaration;
  isConstant = false;
  identifier;
  right = null;
  constructor(identifier, isConstant, right = null) {
    super();
    this.identifier = identifier;
    if (isConstant) this.isConstant = true;
    this.right = right;
  }
}

class VariableAssignment extends Statement {
  type = NodeTypes.VariableAssignment;
  identifier;
  right = null;
  constructor(identifier, right = null) {
    super();
    this.identifier = identifier;
    this.right = right;
  }
}

class FunctionCall extends Expression {
  type = NodeTypes.FunctionCall;
  caller;
  arguments = [];

  constructor(caller, args) {
    super();
    this.caller = caller;
    this.arguments = args;
  }
}

class ObjectMember extends Expression {
  type = NodeTypes.ObjectMember;
  object;
  member;
  computed = false;
  assignment;

  constructor(object, member, computed = false) {
    super();
    this.object = object;
    this.member = member;
    this.computed = computed;
  }
}

class BooleanExpression extends Expression {
  type = NodeTypes.BooleanExpression;
  left = new Expression(); // Expression
  right = new Expression(); // Expression
  operator = ""; // String
  constructor(left, operator, right) {
    super();
    this.left = left;
    this.right = right;
    this.operator = operator;
  }
}

class BinaryExpression extends Expression {
  type = NodeTypes.BinaryExpression;
  left = new Expression(); // Expression
  right = new Expression(); // Expression
  operator = ""; // String
  constructor(left, operator, right) {
    super();
    this.left = left;
    this.right = right;
    this.operator = operator;
  }
}

class LogicalExpression extends Expression {
  type = NodeTypes.LogicalExpression;
  left = new Expression(); // Expression
  right = new Expression(); // Expression
  operator = ""; // String
  equals = false; // Boolean
  constructor(left, operator, equals, right) {
    super();
    this.left = left;
    this.right = right;
    this.equals = equals;
    this.operator = operator;
  }
}

class NotExpression extends Expression {
  type = NodeTypes.NotExpression;
  expression = new Expression();
  constructor(expression) {
    super();
    this.expression = expression;
  }
}

class NumericLiteral extends Expression {
  type = NodeTypes.NumericLiteral;
  value = 0; // number
  constructor(value = 0) {
    super();
    this.value = value;
  }
}

class StringLiteral extends Expression {
  type = NodeTypes.StringLiteral;
  value = ""; // string
  constructor(value = "") {
    super();
    this.value = value;
  }
}

class ArrayLiteral extends Expression {
  type = NodeTypes.ArrayLiteral;
  value = []; // array of expressions

  constructor(value = []) {
    super();
    this.value = value;
  }
}

class ObjectLiteral extends Expression {
  type = NodeTypes.ObjectLiteral;
  properties = [];

  constructor(properties) {
    super();
    this.properties = properties;
  }
}

class Identifier extends Expression {
  type = NodeTypes.Identifier;
  symbol = "";
  constructor(symbol = "") {
    super();
    this.symbol = symbol;
  }
}