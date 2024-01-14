// right now this is stupid
// in the future improve this nonsense

function importLibraries(scope) {
  const canvas = document.getElementById("display");
  let intervals = [], stillRunning = true, ctx;
  
  let rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  
  scope.declareVariable("true", new Value(ValueTypes.Boolean, 1, true));
  scope.declareVariable("false", new Value(ValueTypes.Boolean, 0, true));
  scope.declareVariable("null", new Value(ValueTypes.Null, null, true));

  scope.declareVariable("print", new NativeFunction((args, scope) => {
    args.forEach(arg => {
      output(arg);
    })
  }));

  scope.declareVariable("clear", new NativeFunction((args, scope) => {
    while (document.getElementById("output").hasChildNodes())
        document.getElementById("output").removeChild(document.getElementById("output").firstChild);
  }));

  scope.declareVariable("rand", new NativeFunction((args, scope) => {
    return new Value(ValueTypes.Number, Math.random());
  }));

  scope.declareVariable("sqrt", new NativeFunction((args, scope) => {
    return new Value(ValueTypes.Number, Math.sqrt(args[0].value));
  }));

  scope.declareVariable("time", new NativeFunction((args, scope) => {
    return new Value(ValueTypes.Number, performance.now());
  }));

  scope.declareVariable("resizeCanvas", new NativeFunction((args, scope) => {
    if (!ctx) throw "Canvas hasn't been initialized. Try canvas(number, number).";
    canvas.width = args[0].value;
    canvas.height = args[1].value;
  }));

  scope.declareVariable("getCanvasAspect", new NativeFunction((args, scope) => {
    let rect = canvas.getBoundingClientRect();
    return new Value(ValueTypes.Number, rect.width / rect.height);
  }));

  scope.declareVariable("getCanvasWidth", new NativeFunction((args, scope) => {
    return new Value(ValueTypes.Number, canvas.width);
  }));

  scope.declareVariable("getCanvasHeight", new NativeFunction((args, scope) => {
    return new Value(ValueTypes.Number, canvas.height);
  }));

  scope.declareVariable("initializeCanvas", new NativeFunction((args, scope) => {
    if (ctx) throw "Canvas has already been initialized. Try resize(number, number).";

    ctx = canvas.getContext("2d");
    canvas.width = args[0]?.value || canvas.width;
    canvas.height = args[1]?.value || canvas.height;
  }));

  scope.declareVariable("setCanvasFillColor", new NativeFunction((args, scope) => {
    if (!ctx) throw "Canvas hasn't been initialized. Try canvas(number, number).";

    ctx.fillStyle = args[0].value;
  }));

  scope.declareVariable("setCanvasStrokeColor", new NativeFunction((args, scope) => {
    if (!ctx) throw "Canvas hasn't been initialized. Try canvas(number, number).";

    ctx.strokeStyle = args[0].value;
  }));

  scope.declareVariable("setCanvasLineWidth", new NativeFunction((args, scope) => {
    if (!ctx) throw "Canvas hasn't been initialized. Try canvas(number, number).";

    ctx.lineWidth = args[0].value;
  }));

  scope.declareVariable("clearCanvas", new NativeFunction((args, scope) => {
    if (!ctx) throw "Canvas hasn't been initialized. Try canvas(number, number).";

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }));
  
  scope.declareVariable("drawCircle", new NativeFunction((args, scope) => {
    if (!ctx) throw "Canvas hasn't been initialized. Try canvas(number, number).";
    
    ctx.beginPath();
    ctx.arc(args[0].value, args[1].value, args[2].value, 0, 2 * Math.PI);
    ctx.fill();
  }));


  scope.declareVariable("strokeLine", new NativeFunction((args, scope) => {
    if (!ctx) throw "Canvas hasn't been initialized. Try canvas(number, number).";
    
    ctx.beginPath();
    ctx.moveTo(args[0].value, args[1].value); 
    ctx.lineTo(args[2].value, args[3].value);
    ctx.stroke();
  }));

  scope.declareVariable("addElement", new NativeFunction((args, scope) => {
    args?.[0]?.values?.push?.(args[1]);
  }));

  scope.declareVariable("interval", new NativeFunction((args, scope) => {
    intervals.push(setInterval(() => {
      evaluateFunction(args[0], []);
    }, args[1].value));
  }));

  scope.declareVariable("nextFrame", new NativeFunction((args, scope) => {
    if (!stillRunning) return;
    
    requestAnimationFrame(() => {
      evaluateFunction(args[0], []);
    });
  }));

  return () => {
    intervals.forEach(interval => clearInterval(interval));
    stillRunning = false;
  }
}
