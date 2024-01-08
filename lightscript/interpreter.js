/*
Public
-> evaluate(node: Node, scope: Scope) -> RuntimeValue
-> evaluateProgram(program: Program, scope: Scope) -> RuntimeValue

Private
<< TODO: Document the other evaluation functions >> 

Imports
-> * from "./values.js"
-> NodeTypes from "./ast.js"
-> Scope from "./scope.js"
*/

function* evaluateProgram(program, scope) {
  let lastEvaluated = new Value();

  for (let i = 0; i < program.body.length; i++) {
    let node = program.body[i];

    try {
      lastEvaluated = evaluate(node, scope);
      yield;
    } catch (e) {
      console.log(e);
      throw "Runtime Error: " + e;
    }
  }

  return lastEvaluated;
}

function evaluateBinaryExpression(binaryExpression, scope) {
  let leftHand = evaluate(binaryExpression.left, scope);
  let rightHand = evaluate(binaryExpression.right, scope);

  if (leftHand.type == ValueTypes.String || rightHand.type == ValueTypes.String) {
    return evaluateStringOperation(leftHand.value, binaryExpression.operator, rightHand.value);
  }

  if (leftHand.isNaN || rightHand.isNaN) {
    let NaNValue = (leftHand.isNaN ? leftHand : rightHand);
    throw(`Binary expression received value (${NaNValue}) that does not support operand "${binaryExpression.operator}".`);
    return new Value();
  }

  return new Value(ValueTypes.Number, evaluateBinaryOperation(leftHand.value, binaryExpression.operator, rightHand.value));
}

function evaluateBooleanExpression(booleanExpression, scope) {
  let leftHand = evaluate(booleanExpression.left, scope);
  let rightHand = evaluate(booleanExpression.right, scope);
  let operator = booleanExpression.operator;

  return new Value(ValueTypes.Boolean, evaluateBooleanOperation(leftHand.value, operator, rightHand.value));
}

function evaluateLogicalExpression(logicalExpression, scope) {
  let leftHand = evaluate(logicalExpression.left, scope);
  let rightHand = evaluate(logicalExpression.right, scope);
  let operator = logicalExpression.operator;
  let equals = logicalExpression.equals;

  return new Value(ValueTypes.Boolean, evaluateLogicalOperation(leftHand.value, operator, equals, rightHand.value));
}

function evaluateStringOperation(left, operator, right) {
  if (operator == "+") {
    return new Value(ValueTypes.String, left + right);
  }

  if (operator == "-") {
    return new Value(ValueTypes.Number, left - right);
  }

  return new Value();
}

function evaluateBinaryOperation(left, operator, right) {
  if (operator == "+") return left + right;
  if (operator == "-") return left - right;
  if (operator == "/")
    if (right != 0) return left / right;
    else {
      throw "Divide by zero error.";
    }
  if (operator == "*") return left * right;
  if (operator == "%") return left % right;
  return new Value();
}

function evaluateBooleanOperation(left, operator, right) {
  if (operator == "&") return left && right;
  if (operator == "|") return left || right;
  return new Value();
}

function evaluateLogicalOperation(left, operator, equals, right) {
  if (operator == "!") return left != right;
  else if (equals && left == right) return true;
  if (operator == ">") return left > right;
  if (operator == "<") return left < right;
  return false;
}

function evaluateIdentifier(identifier, scope) {
  let value = scope.lookupVariable(identifier.symbol);

  return value;
}

function evaluateObject(objectLiteral, scope) {
  let objectValue = new ObjectValue();

  for (let { key, value } of objectLiteral.properties){
    if (!value) {
      value = scope.lookupVariable(key.symbol);
    } else {
      value = evaluate(value, scope);
    }
    objectValue.properties[key.symbol] = value;
  }

  return objectValue;
}

function evaluateVariableDeclaration(declaration, scope) {
  let name = declaration.identifier.symbol;
  let value = evaluate(declaration.right, scope);

  value.isConstant = declaration.isConstant;

  scope.declareVariable(name, value);

  // variable declarations dont resolve to a value
  return new Value();
}

function evaluateVariableAssignment(assignment, scope) {
  let name = assignment.identifier.symbol;
  let value = evaluate(assignment.right, scope);

  scope.assignVariable(name, value);

  return value;
}

function evaluateStruct(struct, arguments, scope) {
  let object = {};

  for (let i = 0; i < struct.fields.length; i++) {
    let arg = arguments[i];
    let field = struct.fields[i];

    if (!arg) {
      throw("Missing value for struct field");
    }

    if (arg.type != evaluateType(field.type, scope)) {
      if (arg.structName == field.type) {
        object[field.name] = arg;
        continue;
      }
      throw("Incorrect typing for struct field");
    }

    object[field.name] = arg;
  }

  let val = new ObjectValue(object);

  val.structName = struct.name;

  return val;
}

function evaluateType(type, scope) {
  return ValueTypes[type];
}

function evaluateNotExpression(notExpression, scope) {
  let value = evaluate(notExpression.expression, scope);
  return new Value(ValueTypes.Boolean, !value.value);
}

function evaluateCallExpression(callExpression, scope) {
  let functionValue = evaluate(callExpression.caller, scope);
  let rawArguments = callExpression.arguments;
  let argumentValues = rawArguments.map(argument => evaluate(argument, scope));

  if (functionValue.type == ValueTypes.Structure)
    return evaluateStruct(functionValue, argumentValues, scope);

  if (functionValue.type == ValueTypes.NativeFunction)
    return functionValue.method(argumentValues, scope);

  return evaluateFunction(functionValue, argumentValues);
}

function evaluateFunction(functionValue, argumentValues) {
  let functionScope = new Scope(functionValue.scope);

  for (let i = 0; i < functionValue.arguments.length; i++) {
    functionScope.declareVariable(functionValue.arguments[i].symbol, argumentValues[i]);
  }

  for (let i = 0; i < functionValue.body.length; i++) {
    let node = functionValue.body[i];

    if (node.type == NodeTypes.ReturnStatement) {
      return evaluate(node.expression, functionScope);
    }

    if (node.type == NodeTypes.IfStatement) {
      let evaluation = evaluate(node, functionScope);

      if (evaluation.value) return evaluation;
    } else evaluate(node, functionScope);
  }

  return new Value();
}

function evaluateWhileLoop(whileLoop, scope) {
  while (true) {
    let whileScope = new Scope(scope);

    for (let i = 0; i < whileLoop.body.length; i++) {
      let node = whileLoop.body[i];
      evaluate(node, whileScope);
    }

    if (!evaluate(whileLoop.test, scope).value) break;
  }

  return new Value();
}

function evaluateIfStatement(ifStatement, scope) {
  let test = evaluate(ifStatement.test, scope);

  if (test.value) {
    let ifScope = new Scope(scope);

    for (let i = 0; i < ifStatement.consequent.length; i++) {
      let node = ifStatement.consequent[i];

      if (node.type == NodeTypes.ReturnStatement) {
        return evaluate(node.expression, ifScope);
      }

      evaluate(node, ifScope);
    }

    return new Value();
  }

  return new Value();
}

function evaluateFunctionDeclaration(functionDeclaration, scope) {
  let value = new RegularFunction(functionDeclaration.parameters, functionDeclaration.body);
  let name = functionDeclaration?.identifier?.symbol;

  if (!name) throw("Anonymous functions are not supported.");

  scope.declareVariable(name, value);
  scope.attachScope(name);

  // variable declarations dont resolve to a value
  return new Value();
}

function evaluateObjectMember(object, scope) {
  let objectValue = evaluate(object.object, scope);
  let property;

  // not computed -> its a direct identifier access
  // computed -> theres an expr that needs to be evaluated
  if (!object.computed) property = object.member.symbol;
  else property = evaluate(object.member, scope)?.value;

  // if theres an assignment we have things to do
  if (object.assignment) {
    let assignValue = evaluate(object.assignment, scope);
    objectValue.properties[property] = assignValue;
    return assignValue;
  }

  return objectValue.properties[property];
}

function evaluateArrayLiteral(array, scope) {
  let values = [];

  for (let i = 0; i < array.value.length; i++) {
    values.push(evaluate(array.value[i], scope));
  }

  return new ArrayValue(values);
}

function evaluateStructDeclaration(struct, scope) {
  let name = struct.identifier.symbol;
  let value = struct.fields;

  scope.declareVariable(name, new StructValue(value, name));

  // struct declarations dont resolve to a value
  return new Value();
}

function evaluate(node, scope) {
  let type = node.type;

  if (type == NodeTypes.NumericLiteral)
    return new Value(ValueTypes.Number, node.value);

  if (type == NodeTypes.StringLiteral)
    return new Value(ValueTypes.String, node.value);

  if (type == NodeTypes.ObjectLiteral)
    return evaluateObject(node, scope);

  if (type == NodeTypes.ObjectMember)
    return evaluateObjectMember(node, scope);

  if (type == NodeTypes.VariableDeclaration)
    return evaluateVariableDeclaration(node, scope);

  if (type == NodeTypes.VariableAssignment)
    return evaluateVariableAssignment(node, scope);

  if (type == NodeTypes.Identifier)
    return evaluateIdentifier(node, scope);

  if (type == NodeTypes.BinaryExpression)
    return evaluateBinaryExpression(node, scope);

  if (type == NodeTypes.BooleanExpression)
    return evaluateBooleanExpression(node, scope);

  if (type == NodeTypes.LogicalExpression)
    return evaluateLogicalExpression(node, scope);

  if (type == NodeTypes.NotExpression)
    return evaluateNotExpression(node, scope);

  if (type == NodeTypes.FunctionCall)
    return evaluateCallExpression(node, scope);

  if (type == NodeTypes.FunctionDeclaration)
    return evaluateFunctionDeclaration(node, scope);

  if (type == NodeTypes.Program)
    return evaluateProgram(node, scope);

  if (type == NodeTypes.IfStatement)
    return evaluateIfStatement(node, scope);

  if (type == NodeTypes.ArrayLiteral)
    return evaluateArrayLiteral(node, scope);

  if (type == NodeTypes.WhileLoop)
    return evaluateWhileLoop(node, scope);

  if (type == NodeTypes.StructDeclaration)
    return evaluateStructDeclaration(node, scope);

  throw("Interpretation can't continue with an irregular AST node.\nYou probably have a misplaced keyword, like a [Return] outside of a function.");
}