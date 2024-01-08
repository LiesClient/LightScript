/*
Public
-> Scope(parentScope: Scope) {
  parent: Scope
  isGlobal: Bool
  variables: [String -> RuntimeValues]

  attachScope(variableName: String) -> void
  declareVariable(variableName: String, value: RuntimeValue) -> RuntimeValue
  assignVariable(variableName: String, value: RuntimeValue) -> RuntimeValue
  lookupVariable(variableName: String) -> RuntimeValue
  resolve(variableName: String) -> Scope
}

Private
-> (nothing)

Imports
-> * from "./values.js"
*/

class Scope {
  parent = null;
  isGlobal = true;
  variables = {};

  constructor(parentScope) {
    this.parent = parentScope;
    if (this.parent) this.isGlobal = false;
  }

  attachScope(variableName) {
    this.variables[variableName].scope = this;
  }

  declareVariable (variableName, value) {
    if (this.variables.hasOwnProperty(variableName)) {
      throw `Cannot declare variable ${variableName} again.`;
    }

    this.variables[variableName] = value;
    return value;
  }

  assignVariable (variableName, value) {
    let scope = this.resolve(variableName, true);

    if (scope.variables[variableName].isConstant) throw `Cannot assign to constant variable "${variableName}".`;

    if (scope.variables[variableName].type == value.type) {
      return scope.variables[variableName].set(value);
    }

    return scope.variables[variableName] = value;
  }

  lookupVariable (variableName) {
    let scope = this.resolve(variableName);
    return scope.variables[variableName];
  }

  resolve (variableName, assigning = false) {
    if (this.variables?.[variableName]) {
      return this;
    } 

    try {
      return this.parent.resolve(variableName);
    } catch {
      if (assigning) 
        throw `${variableName} hasn't been declared.`
      else throw `Can't resolve ${variableName}.`;
    }
  }
}