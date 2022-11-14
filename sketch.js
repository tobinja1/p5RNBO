async function rnboSetup() {
    const drummerExportURL = "/rK.export.json";

    // Create AudioContext
    const WAContext = window.AudioContext || window.webkitAudioContext;
    const context = new WAContext();

    //const bufferId = "theBuff"; // let's assume we have a [buffer~ my_sample] object in our patch

    // // Load our sample as an ArrayBuffer;
    // const fileResponse = await fetch("perc.wav");
    // const arrayBuf = await fileResponse.arrayBuffer();

  // // Decode the received Data as an AudioBuffer
  //   const audioBuf = await context.decodeAudioData(arrayBuf);

    // Create gain node and connect it to audio output
    const outputNode = context.createGain();
    outputNode.connect(context.destination);


    // Fetch the exported patcher
    let response, patcher;
    try {
        response = await fetch(drummerExportURL);
        patcher = await response.json();

        if (!window.RNBO) {
            // Load RNBO script dynamically
            // Note that you can skip this by knowing the RNBO version of your patch
            // beforehand and just include it using a <script> tag
            await loadRNBOScript(patcher.desc.meta.rnboversion);
        }

    } catch (err) {
        const errorContext = {
            error: err
        };
        if (response && (response.status >= 300 || response.status < 200)) {
            errorContext.header = `Couldn't load patcher export bundle`,
            errorContext.description = `Check app.js to see what file it's trying to load. Currently it's` +
            ` trying to load "${drummerExportURL}". If that doesn't` +
            ` match the name of the file you exported from RNBO, modify` +
            ` drummerExportURL in app.js.`;
        }
        if (typeof guardrails === "function") {
            guardrails(errorContext);
        } else {
            throw err;
        }
        return;
    }

    // // (Optional) Fetch the dependencies
    // let dependencies = [];
    // try {
    //     const dependenciesResponse = await fetch("export/dependencies.json");
    //     dependencies = await dependenciesResponse.json();
    //
    //     // Prepend "export" to any file dependenciies
    //     dependencies = dependencies.map(d => d.file ? Object.assign({}, d, { file: "export/" + d.file }) : d);
    // } catch (e) {}

    // Create the device


    try {
        drummer = await RNBO.createDevice({ context, patcher });
    } catch (err) {
        if (typeof guardrails === "function") {
            guardrails({ error: err });
        } else {
            throw err;
        }
        return;
    }

        // Set the DataBuffer on the device
    //await drummer.setDataBuffer(bufferId, audioBuf);

    //MESSING WITH PARAMETERS HERE
    // const dampP = device.parametersById.get("damp");
    // dampP.value = 1;

    // Connect the device to the web audio graph
    drummer.node.connect(outputNode);

const s = p => {
  let x = 100;
  let y = 100;

  var angle = 2.0;
  var offset = 300;
  var scalar = 5.5;
  var speed = 0.25;
  var col = {
    r: 255,
    g: 0,
    b: 0
  };

  let cnv;
  let a = 255;

  p.setup = function() {
     cnv = p.createCanvas(p.windowWidth, p.windowHeight);
     offsetX = p.windowWidth/2;
     offsetY = p.windowHeight/2;
     p.noStroke();
     p.background(0,0);
  };

  p.draw = function() {
    let adjustedY = 1 - (p.mouseY/p.windowHeight);
    const volP = drummer.parametersById.get("volume");
    volP.value = adjustedY;

    let pX = offsetX + p.cos(angle) * scalar;
    let pY = offsetY + p.sin(angle) * scalar;

    p.fill(255, 94, 242, a);
    p.ellipse(pX, pY, 5, 5);
    angle += speed;
    scalar += speed;
    a -= 0.2;
  };
};

new p5(s); // invoke p5

    // (Optional) Extract the name and rnbo version of the patcher from the description
    //document.getElementById("patcher-title").innerText = (patcher.desc.meta.filename || "Unnamed Patcher") + " (v" + patcher.desc.meta.rnboversion + ")";

    // (Optional) Automatically create sliders for the device parameters
    //makeSliders(drummer);

    // init();
    // canvas.onmousedown = myDown;
    // canvas.onmouseup = myUp;

    // (Optional) Create a form to send messages to RNBO inputs
    //makeInportForm(device);

    // (Optional) Attach listeners to outports so you can log messages from the RNBO patcher
    //attachOutports(device);

    // (Optional) Load presets, if any
    //loadPresets(device, patcher);

    // (Optional) Connect MIDI inputs
    //makeMIDIKeyboard(device);

    document.body.onclick = () => {
        context.resume();
    }

    // Skip if you're not using guardrails.js
    if (typeof guardrails === "function")
        guardrails();
}

function loadRNBOScript(version) {
    return new Promise((resolve, reject) => {
        if (/^\d+\.\d+\.\d+-dev$/.test(version)) {
            throw new Error("Patcher exported with a Debug Version!\nPlease specify the correct RNBO version to use in the code.");
        }
        const el = document.createElement("script");
        el.src = "https://c74-public.nyc3.digitaloceanspaces.com/rnbo/" + encodeURIComponent(version) + "/rnbo.min.js";
        el.onload = resolve;
        el.onerror = function(err) {
            console.log(err);
            reject(new Error("Failed to load rnbo.js v" + version));
        };
        document.body.append(el);
    });
}

function makeSliders(device) {
    let pdiv = document.getElementById("rnbo-parameter-sliders");
    let noParamLabel = document.getElementById("no-param-label");
    if (noParamLabel && device.numParameters > 0) pdiv.removeChild(noParamLabel);

    // This will allow us to ignore parameter update events while dragging the slider.
    let isDraggingSlider = false;
    let uiElements = {};

    device.parameters.forEach(param => {
        // Subpatchers also have params. If we want to expose top-level
        // params only, the best way to determine if a parameter is top level
        // or not is to exclude parameters with a '/' in them.
        // You can uncomment the following line if you don't want to include subpatcher params

        //if (param.id.includes("/")) return;

        // Create a label, an input slider and a value display
        let label = document.createElement("label");
        let slider = document.createElement("input");
        let text = document.createElement("input");
        let sliderContainer = document.createElement("div");
        sliderContainer.appendChild(label);
        sliderContainer.appendChild(slider);
        //sliderContainer.appendChild(text);

        // Add a name for the label
        label.setAttribute("name", param.name);
        label.setAttribute("for", param.name);
        label.setAttribute("class", "param-label");
        label.textContent = `${param.name}: `;

        // Make each slider reflect its parameter
        slider.setAttribute("type", "range");
        slider.setAttribute("class", "param-slider");
        slider.setAttribute("id", param.id);
        slider.setAttribute("name", param.name);
        slider.setAttribute("min", param.min);
        slider.setAttribute("max", param.max);
        if (param.steps > 1) {
            slider.setAttribute("step", (param.max - param.min) / (param.steps - 1));
        } else {
            slider.setAttribute("step", (param.max - param.min) / 1000.0);
        }
        slider.setAttribute("value", param.value);

        // // Make a settable text input display for the value
        // text.setAttribute("value", param.value.toFixed(1));
        // text.setAttribute("type", "text");

        // Make each slider control its parameter
        slider.addEventListener("pointerdown", () => {
            isDraggingSlider = true;
        });
        slider.addEventListener("pointerup", () => {
            isDraggingSlider = false;
            slider.value = param.value;
            text.value = param.value.toFixed(1);
        });
        slider.addEventListener("input", () => {
            let value = Number.parseFloat(slider.value);
            param.value = value;
        });

        // Make the text box input control the parameter value as well
        // text.addEventListener("keydown", (ev) => {
        //     if (ev.key === "Enter") {
        //         let newValue = Number.parseFloat(text.value);
        //         if (isNaN(newValue)) {
        //             text.value = param.value;
        //         } else {
        //             newValue = Math.min(newValue, param.max);
        //             newValue = Math.max(newValue, param.min);
        //             text.value = newValue;
        //             param.value = newValue;
        //         }
        //     }
        // });

        // Store the slider and text by name so we can access them later
        uiElements[param.name] = { slider, text };

        // Add the slider element
        pdiv.appendChild(sliderContainer);
    });

    // Listen to parameter changes from the device
    device.parameterChangeEvent.subscribe(param => {
        if (!isDraggingSlider)
            uiElements[param.name].slider.value = param.value;
        uiElements[param.name].text.value = param.value.toFixed(1);
    });
}

function makeInportForm(device) {
    const idiv = document.getElementById("rnbo-inports");
    const inportSelect = document.getElementById("inport-select");
    const inportText = document.getElementById("inport-text");
    const inportForm = document.getElementById("inport-form");
    let inportTag = null;

    // Device messages correspond to inlets/outlets or inports/outports
    // You can filter for one or the other using the "type" of the message
    const messages = device.messages;
    const inports = messages.filter(message => message.type === RNBO.MessagePortType.Inport);

    if (inports.length === 0) {
        idiv.removeChild(document.getElementById("inport-form"));
        return;
    } else {
        idiv.removeChild(document.getElementById("no-inports-label"));
        inports.forEach(inport => {
            const option = document.createElement("option");
            option.innerText = inport.tag;
            inportSelect.appendChild(option);
        });
        inportSelect.onchange = () => inportTag = inportSelect.value;
        inportTag = inportSelect.value;

        inportForm.onsubmit = (ev) => {
            // Do this or else the page will reload
            ev.preventDefault();

            // Turn the text into a list of numbers (RNBO messages must be numbers, not text)
            const values = inportText.value.split(/\s+/).map(s => parseFloat(s));

            // Send the message event to the RNBO device
            let messageEvent = new RNBO.MessageEvent(RNBO.TimeNow, inportTag, values);
            device.scheduleEvent(messageEvent);
        }
    }
}

function attachOutports(device) {
    const outports = device.messages.filter(message => message.type === RNBO.MessagePortType.Outport);
    if (outports.length < 1) {
        document.getElementById("rnbo-console").removeChild(document.getElementById("rnbo-console-div"));
        return;
    }

    document.getElementById("rnbo-console").removeChild(document.getElementById("no-outports-label"));
    device.messageEvent.subscribe((ev) => {

        // Message events have a tag as well as a payload
        console.log(`${ev.tag}: ${ev.payload}`);

        document.getElementById("rnbo-console-readout").innerText = `${ev.tag}: ${ev.payload}`;
    });
}

function loadPresets(device, patcher) {
    let presets = patcher.presets || [];
    if (presets.length < 1) {
        document.getElementById("rnbo-presets").removeChild(document.getElementById("preset-select"));
        return;
    }

    document.getElementById("rnbo-presets").removeChild(document.getElementById("no-presets-label"));
    let presetSelect = document.getElementById("preset-select");
    presets.forEach((preset, index) => {
        const option = document.createElement("option");
        option.innerText = preset.name;
        option.value = index;
        presetSelect.appendChild(option);
    });
    presetSelect.onchange = () => device.setPreset(presets[presetSelect.value].preset);
}

function makeMIDIKeyboard(device) {
    let mdiv = document.getElementById("rnbo-clickable-keyboard");
    if (device.numMIDIInputPorts === 0) return;

    mdiv.removeChild(document.getElementById("no-midi-label"));

    const midiNotes = [49, 52, 56, 63];
    midiNotes.forEach(note => {
        const key = document.createElement("div");
        const label = document.createElement("p");
        label.textContent = note;
        key.appendChild(label);
        key.addEventListener("pointerdown", () => {
            let midiChannel = 0;

            // Format a MIDI message paylaod, this constructs a MIDI on event
            let noteOnMessage = [
                144 + midiChannel, // Code for a note on: 10010000 & midi channel (0-15)
                note, // MIDI Note
                100 // MIDI Velocity
            ];

            let noteOffMessage = [
                128 + midiChannel, // Code for a note off: 10000000 & midi channel (0-15)
                note, // MIDI Note
                0 // MIDI Velocity
            ];

            // Including rnbo.min.js (or the unminified rnbo.js) will add the RNBO object
            // to the global namespace. This includes the TimeNow constant as well as
            // the MIDIEvent constructor.
            let midiPort = 0;
            let noteDurationMs = 250;

            // When scheduling an event to occur in the future, use the current audio context time
            // multiplied by 1000 (converting seconds to milliseconds) for now.
            let noteOnEvent = new RNBO.MIDIEvent(device.context.currentTime, midiPort, noteOnMessage);
            let noteOffEvent = new RNBO.MIDIEvent(device.context.currentTime * 1000 + noteDurationMs, midiPort, noteOffMessage);

            device.scheduleEvent(noteOnEvent);
            device.scheduleEvent(noteOffEvent);

            key.classList.add("clicked");
        });

        key.addEventListener("pointerup", () => key.classList.remove("clicked"));

        mdiv.appendChild(key);
    });
}

rnboSetup();

// function setup() {
//   cnv = createCanvas(windowWidth, windowHeight);
//   offsetX = windowWidth/2;
//   offsetY = windowHeight/2;
//   noStroke();
//   background (0,0);
//
//   rnboSetup();
// }
//
// function draw() {
//   var x = offsetX + cos(angle) * scalar;
//   var y = offsetY + sin(angle) * scalar;
//
//   let alp = 0;
//
//   fill(255, 94, 242, a);
//   noStroke();
//   ellipse(x, y, 5, 5);
//   angle += speed;
//   scalar += speed;
//   a -= 0.2;
//
//   // const pVol = drummer.parametersById.get("volume");
//   // pVol.value = mouseY/windowHeight;
//
//   fromDrawMouseY = mouseY;
//   // dampP.value = 1;
// }
//
// // function mousePressed() {
// //   //declared the canvas above, so I can access it here
// //   saveCanvas(cnv, 'myCanvas', 'png');
// // }
