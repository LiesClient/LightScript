const outputDiv = document.getElementById("output");
const inputDiv = document.getElementById("input");
const tabs = "\t";

let stopCurrentProcess = () => {};

const repr = {
  newline: "<-n->",
  tab: "<-t->",
  plus: "<-p->"
}

const code = new URLSearchParams(window.location.search).get("code");
if (code) 
  inputDiv.value = 
    code.replaceAll(repr.newline, "\n")
        .replaceAll(repr.tab, tabs)
        .replaceAll(repr.plus, "+");

inputDiv.addEventListener("keydown", e => {
  if (e.key == "Tab") {
    e.preventDefault();
    console.log("tabbing...");
    var start = inputDiv.selectionStart;
    var end = inputDiv.selectionEnd;

    inputDiv.value = inputDiv.value.substring(0, start) + tabs + inputDiv.value.substring(end);
    inputDiv.selectionStart = inputDiv.selectionEnd = start + tabs.length;
  }
});

function output(...values) {
  values.map(value => value?.toString?.()?.split?.("\\n") || value?.toString?.()).flat().forEach(str => {
    let txt = document.createElement("p");
    txt.textContent = str;
    txt.innerHTML += "\n";
    outputDiv.append(txt);
  });
}

function outputErrors(...values) {
  values.map(value => value?.toString?.()?.split?.("\\n") || value?.toString?.()).flat().forEach(str => {
    let txt = document.createElement("p");
    txt.textContent = str;
    txt.innerHTML += "\n";
    txt.style.color = "red";
    outputDiv.append(txt);
    outputDiv.append(document.createElement("br"));
  });
}

function run(refresh = true) {
  try {
    let src = document.getElementById('input').value;
    if (refresh) {
      let urlsrc = src
        .split("\n").join(repr.newline)
        .split(tabs).join(repr.tab)
        .split("+").join(repr.plus);
      history.pushState({ }, null, "?code=" + urlsrc);
    }
    evaluateSource(src);
  } catch (e) {
    outputErrors(e);
  }
}

function evaluateSource(str) {
  stopCurrentProcess();
  
  while (outputDiv.hasChildNodes())
    outputDiv.removeChild(outputDiv.firstChild);

  const parser = new Parser();
  const scope = new Scope();

  stopCurrentProcess = importLibraries(scope);

  const tokens = tokenize(str);
  const ast = parser.parse(tokens);
  const interpreter = evaluate(ast, scope);
  let result = null;

  function interpret(){
    result = interpreter.next();
    if (result.done) return;

    setTimeout(interpret);
  }

  interpret()

  console.log(result);

  // if result can be stringified
  // we can output it
  if (result?.value?.toString) output(result);
}

// run(false);