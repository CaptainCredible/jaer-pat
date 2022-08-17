let list = 0
let myOnTime = 0
let portBOnTimes: number[] = []
let portAOnTimes: number[] = []
let pauseLength = 0
//let outputBBuffer = 0
let portBTimers: number[] = []
let portATimers: number[] = []
let flip = false
let myOnTimer = 0
//let outputABuffer = 1
let outPut = 0
let midiChannel: midi.MidiController = null
let anOutputIsOn = false
let incrementor = 0
let notes: number[] = []
let chan = 0
let muted = false
let pinA = DigitalPin.P1
let pinB = DigitalPin.P8
let pinC = DigitalPin.P16
const NOTE_ON = 0x90
const NOTE_OFF = 0x80
let strip = neopixel.create(DigitalPin.P2, 28, NeoPixelMode.RGB)
strip.showRainbow(1, 360)



function noteOn(note: number, velocity: number, channel: number) {
    let midiMessage = pins.createBuffer(3);
    midiMessage.setNumber(NumberFormat.UInt8LE, 0, NOTE_ON | channel);
    midiMessage.setNumber(NumberFormat.UInt8LE, 1, note);
    midiMessage.setNumber(NumberFormat.UInt8LE, 2, velocity);
    serial.writeBuffer(midiMessage);
}

loops.everyInterval(1, function () {
    if(input.runningTime()>myOnTimer){

    }
    strip.shift(2);
    strip.show();
})

function noteOff(note: number, velocity: number, channel: number) {
    let midiMessage = pins.createBuffer(3);
    midiMessage.setNumber(NumberFormat.UInt8LE, 0, NOTE_OFF | channel);
    midiMessage.setNumber(NumberFormat.UInt8LE, 1, note);
    midiMessage.setNumber(NumberFormat.UInt8LE, 2, velocity);
    serial.writeBuffer(midiMessage);
}

let pinArray = [pinA, pinB, pinC];

pins.digitalWritePin(pinA, 1);
pins.digitalWritePin(pinB, 1);
pins.digitalWritePin(pinC, 1);

let portAIsOn: boolean[] = []
let portBIsOn: boolean[] = []
portAIsOn = [false, false, false, false, false, false, false, false]
portBIsOn = [false, false, false, false, false, false, false, false]
radio.onReceivedValue(function (name, value) {
    if (!muted) {
        if (name == "Pat") {
            if (value < 16 && value > -1) {
                outPut = value
                handleOutput()
            }
        } else if (name == "PatP") {
            led.toggleAll();
            bitCheckMask = 1
            for (let i = 0; i <= 16 - 1; i++) {
                if (bitCheckMask & value) {
                    outPut = i
                    handleOutput()
                }
                bitCheckMask = bitCheckMask << 1
            }
        }
    }
    if (name == "m") {
        /*
        Bob 00000001
        Tim 00000010
        Ted 00000100
        Pat 00001000
        Cat 00010000
        Dad 00100000
        Mum 01000000
        Zim 10000000
        */
        if (value & 0b00001000) {
            muted = true
            basic.showIcon(IconNames.No, 1)
        } else if (muted) {
            muted = false
            basic.clearScreen()
        }
    }
})


function debugMessage(name: string, val: number){
    serial.redirectToUSB();
    serial.writeValue(name, val);
    serial.redirect(
        SerialPin.P0,
        SerialPin.USB_RX,
        BaudRate.BaudRate31250
    )
}

function sendMidi() {
    midiChannel.noteOn(50 - myNote)
    basic.pause(1)
    led.toggle(0, 0)
    midiChannel.noteOff(50 - myNote)
    basic.pause(1)
}
function handleOutput() {
    myOnTimer = input.runningTime() + myOnTime
    if (outPut < 5) {
        led.plot(0, outPut)
        led.plot(1, outPut)
        led.plot(2, outPut)
        led.plot(3, outPut)
        led.plot(4, outPut)
    } else if (outPut < 10) {
        led.plot(outPut - 5, 0)
        led.plot(outPut - 5, 1)
        led.plot(outPut - 5, 2)
        led.plot(outPut - 5, 3)
        led.plot(outPut - 5, 4)
    }
    
    let notesThatAreOn = [];
    myNote = outPut;

    if (outPut < 10) {
        noteOn(55, 127, outPut)
        //noteOff(55, 120, outPut)
    } else if(outPut < 13) {
        pins.digitalWritePin(pinArray[outPut - 10], 0);
        anOutputIsOn = true;
    }
    let rBowPos = outPut*30
    strip.showRainbow(rBowPos, rBowPos+30);
}

function updateMCP23017() {
    MCP23017.updateOutputAOn(ADDRESS.A27)
    MCP23017.updateOutputBOn(ADDRESS.A27)
}

function handleMCP23017Out() {
    if (myNote < 8) {
        if (portBIsOn[myNote]) { // if this note is allready on
            //turn it of immediately 
            MCP23017.setOutputB(myNote)
            MCP23017.updateOutputBOn(myNote)
            portBIsOn[myNote] = false
            basic.pause(1)
        }
        MCP23017.clearOutputB(myNote) //inverted for atmega drummachine
        portBTimers[myNote] = input.runningTime()
        portBIsOn[myNote] = true
    } else {
        // serial.writeValue("more than 8", myNote)
        MCP23017.setOutputA(myNote - 8)
        portATimers[myNote] = input.runningTime()
    }
}
input.onButtonPressed(Button.A, () => {
    chan += 1
    midiChannel = midi.channel(chan)
})
outputABuffer = 1
function handleMCP23017offs() {
    if (outputABuffer > 0) {
        for (let handleMCP23017offsIndexA = 0; handleMCP23017offsIndexA <= 8 - 1; handleMCP23017offsIndexA++) {
            if (input.runningTime() > portATimers[handleMCP23017offsIndexA] + portAOnTimes[handleMCP23017offsIndexA]) {
                MCP23017.clearOutputA(handleMCP23017offsIndexA)
                MCP23017.updateOutputAOn(ADDRESS.A27)
                portAIsOn[handleMCP23017offsIndexA] = false
            }
        }
        //  led.toggleAll()
    }
    if (outputBBuffer > 0) {
        for (let handleMCP23017offsIndexB = 0; handleMCP23017offsIndexB <= 8 - 1; handleMCP23017offsIndexB++) {
            if (input.runningTime() > portBTimers[handleMCP23017offsIndexB] + portBOnTimes[handleMCP23017offsIndexB]) {
                MCP23017.setOutputB(handleMCP23017offsIndexB)
                MCP23017.updateOutputBOn(ADDRESS.A27)
                portBIsOn[handleMCP23017offsIndexB] = false
            }
        }
    }
}


let myNote = 0
let bitCheckMask = 0
incrementor = 0
flip = false
pauseLength = 0
serial.redirect(
    SerialPin.P0,
    SerialPin.USB_RX,
    BaudRate.BaudRate31250
)
let newChan = 0;
let pinTimer = 0;
portAOnTimes = [100, 100, 100, 100, 100, 100, 100, 100]
portBOnTimes = [10, 10, 10, 10, 10, 10, 10, 10]
portATimers = [0, 0, 0, 0, 0, 0, 0, 0]
portBTimers = [0, 0, 0, 0, 0, 0, 0, 0]
//let myPins: number[]
MCP23017.setPortAsOutput(ADDRESS.A27, SET_PORT.A)
MCP23017.setPortAsOutput(ADDRESS.A27, SET_PORT.B)
MCP23017.fillOutputBBuffer()
updateMCP23017()
basic.showLeds(`
    . # . # .
    . # . # .
    # # . # #
    . # . # .
    . # . # .
    `)
basic.pause(500)
myOnTime = 20
//myPins = [9, 15, 20, 21, 22, 23]
list = 0
radio.setGroup(83)
music.setTempo(200)
basic.forever(() => {
    if (input.runningTime() > myOnTimer) {
        if (!muted) {
            basic.clearScreen()
        } else {
            basic.showIcon(IconNames.No, 1)
        }
        led.plot(0, 0)
        if(anOutputIsOn){
            pins.digitalWritePin(pinA, 1);
            pins.digitalWritePin(pinB, 1);
            pins.digitalWritePin(pinC, 1);
        }
        anOutputIsOn = false
    }
})