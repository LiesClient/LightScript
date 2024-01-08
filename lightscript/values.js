/*
  Public
  -> ValueTypes[String -> Int]
  -> toValueType[Int -> String]

  -> Value*[RuntimeValue](type: Int, value, isConstant: Bool)<id: Int, isNaN: Bool, isPrimitive = true>
  -> ObjectValue*[RuntimeValue](properties: Object, isConstant: Bool)<type = ValueTypes.Object: Int, isNaN = true, isPrimitive = false, structName: String>
  -> ArrayValue*[RuntimeValue](values: RuntimeValue[], isConstant: Bool)<type = ValueTypes.Array: Int, isNaN = true, isPrimitive = false>
  -> StructValue*[RuntimeValue](fields: Field[], name: String)<type = ValueTypes.Struct: Int, isNaN = true, isPrimitive = false, isConstant = true>
  -> NativeFunction*[RuntimeValue](method: Method)<type = ValueTypes.NativeFunction: Int, isNaN = true, isPrimitive = false, isConstant = true>
  -> RegularFunction*[RuntimeValue](argymentss: String[], body: Statement[])<type = ValueTypes.RegularFunction: Int, isNaN = true, isPrimitive = false, isConstant = true>

  Note: 

  Private
  -> RuntimeValue {
    get value -> Any
    toValue() -> Any
    stringify() -> String
    toString() -> String
  }
  -> Method: (values: RuntimeValue[], scope: Scope) -> (RuntimeValue | Null) 

  Imports
  -> (Field) from "./ast.js" ... kinda?
*/

const ValueTypes = {};
const toValueType = {};

// token types "compiler"
(() => {
  let types = [
    "Null",
    "Number",
    "String",
    "Boolean",
    "Object",
    "Array",
    "NativeFunction",
    "Function",
    "Structure",
  ];

  for (let i = 0; i < types.length; i++) {
    let type = types[i];

    ValueTypes[type] = i;
    toValueType[i] = type;
  }
})();

// primitive values
// like number, boolean, undefined/null
class Value {
  type = ValueTypes.Null;
  id = -1;
  value = null;
  isConstant = false;
  isNaN = true;
  isPrimitive = true;
  constructor(type, value, isConstant = false) {
    this.id = Math.floor(Math.random() * 99);
    this.type = type;
    this.value = value;
    this.isConstant = isConstant;
    if (this.type == ValueTypes.Number || this.type == ValueTypes.Boolean) this.isNaN = false;
  }

  stringify() {
    return this.toString();
  }

  toString() {
    if (this.type == ValueTypes.Boolean) 
      return (this.value ? true : false);

    if (this.type == ValueTypes.Number)
      return this.value;

    if (this.type == ValueTypes.Null)
      return null;

    if (this.type == ValueTypes.String)
      return this.value;
  }

  set(value) {
    this.value = value.value;
  }

  toValue() {
    return this.value;
  }
}

class ObjectValue {
  type = ValueTypes.Object;
  properties = {};
  isConstant = false;
  isNaN = true;
  isPrimitive = false;
  structName = "";
  constructor(properties = {}, isConstant = false) {
    this.properties = properties;
    this.isConstant = isConstant;
  }

  get value() {
    return this.properties;
  }

  stringify() {
    return this.toString();
  }

  toString() {
    let object = {};

    Object.keys(this.properties).forEach(key => {
      let property = this.properties[key];
      if (property.isPrimitive) {
        object[key] = property.toString();
      } else {
        object[key] = property.toValue();
      }
    });

    let string = JSON.stringify(object, null, 2).replace(/"([^"]+)":/g, '$1:');

    return string;
  }

  set(value) {
    this.properties = value.properties;
  }

  toValue() {
    let object = {};

    Object.keys(this.properties).forEach(key => {
      let property = this.properties[key];
      object[key] = property?.toValue?.() || property.value;
    });

    return object;
  }
}

class ArrayValue {
  type = ValueTypes.Array;
  values = [];
  isConstant = false;
  isNaN = true;
  isPrimitive = false;
  
  constructor(values, isConstant = false) {
    this.values = values;
    this.isConstant = isConstant;
  }

  stringify() {
    return this.toString();
  }

  get properties() {
    return this.values;
  }

  set properties(props) {
    this.values = props;
  }

  get value() {
    return this.values;
  }

  set value(value) {
    this.values = value;
  }

  set(value) {
    this.values = value.values;
  }

  toString() {
    let array = [];

    this.values.forEach(value => {
      if (value.isPrimitive) {
        array.push(value.toString());
      } else {
        array.push(value.toValue());
      }
    });

    let string = JSON.stringify(array, null, 2).replace(/"([^"]+)":/g, '$1:');

    return string;
  }

  toValue() {
    return this.values.map(v => v.toValue());
  }
}

class StructValue {
  type = ValueTypes.Structure;
  fields = [];
  isPrimitive = false;
  isConstant = true;
  isNaN = true;
  name = "";

  constructor(fields, name) {
    this.fields = fields;
    this.name = name;
  }

  stringify() {
    return this.toString();
  }

  toString() {
    let str = `{\n`;

    for (let i = 0; i < this.fields.length; i++) {
      let field = this.fields[i]
      str += `\t${field.name}: ${field.type}\n`
    }

    str += "}"

    return str;
  }

  set(value) {
    this.fields = value.fields;
  }

  toValue() {
    return `{\n${this.fields.map(v => `\t${v.name}: ${v.type}\n`)}}`;
  }
}

// like console.log
class NativeFunction {
  type = ValueTypes.NativeFunction;
  method; // method(values[], scope) => value
  isPrimitive = false;
  isConstant = true;
  isNaN = true;
  constructor(method) {
    this.method = method;
  }

  stringify() {
    return this.toString();
  }

  toString() {
    return "[NativeFunction]"
  }

  toValue() {
    return { NativeFunction: true }
  }
}

class RegularFunction {
  type = ValueTypes.Function;
  arguments = [];
  body = [];
  isPrimitive = false;
  isConstant = true;
  isNaN = true;

  stringify() {
    return this.toString();
  }

  // I hate _arguments, but arguments is "dissallowed in strict mode"
  constructor (_arguments, body) {
    this.arguments = _arguments;
    this.body = body;
  }

  toValue () {
    return { FunctionValue: true }
  }
}