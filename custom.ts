/////
/**
 * TODO
 * think about clock vs radioticks (try to follow own clock, but if tick comes in and it was more than 1/2 step duration since last step then follow the tick)
 * make sure microbit has ID and setup outputs before sending any radio messages
 * link sendHardware to the hardware out for the receiver code
 */


/**
 * Use this file to define custom functions and blocks.
 * Read more at https://makecode.microbit.org/blocks/custom
 */

let onTime = 10;

let numberOfOutputs = 128
let outputMode = 0 // how to automatically handle outputs 0 = none, 1 = pins, 2 = mcp23017
let outputIsOn: boolean[] = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]
let onTimer: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
let pinOutputRoutings: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

let musicianName = "Bob"
let microBitID = 9876 //9876 is a secret number that lets our code know that this hasn't been set yet
let isMusician: boolean = false; //this is a flag to remind us wether we are a musician or a conductor
let extClock = 0

//sequencer stuff:
let masterTempo = 120
let sequencerExists = false;
let stepLengthms = (60000 / masterTempo) >> 1
let currentStep = 0 // the current step
let masterClockStep = 120
let offLed = 0 // the led to turn off (previous step)
let ledCursor = 0
let seqLength = 16
let part = 0
let oldPart = 99
let seqA = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]
let seqB = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]
let seqC = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]
let seqD = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]
let channelIsSetup = [false, false, false, false]
let lastClockTickTime = 0
let triggerBuffer: boolean[] = []
let lastStep = seqLength
let channelSelect = 0
let channelOutNames: string[] = ["Bob", "Tim", "Pat", "Liz"]
let channelOutNotes: number[] = [0, 1, 2, 3]
let outPutToTrigger = 0
let bWasPressed = false
let aWasPressed = false
let stepToWrite = 0 //stores the step we actually want to write a note to (could be the next step if we pressed just a little too early)
let earlyTrigger = false //a flag to tell the note player not to play note on buttonpress if it was pressed just before a step
let isMasterClock = false
let metronome = false

///
////
////

/// receiver stuff
//let onTimer = 0





enum internalExternal {
    //%block="external_clock"
    external_clock = 1,
    //%block="internal_clock"
    internal_clock = 0
}

enum numberofSteps {

    //%block="four"
    four = 4,
    //%block="eight"
    eight = 8,
    //%block="sixteen"
    sixteen = 16,
    //%block="thirty two"
    thirty_two = 32
}

enum channels {
    //%block="one"
    one = 0,
    //%block="two"
    two = 1,
    //%block="three"
    three = 2,
    //%block="four"
    four = 3
}

enum brightnesses {
    //%block="ow_my_eyes"
    ow_my_eyes = 255,
    //%block="bright"
    bright = 100,
    //%block="a_little_less_bright"
    a_little_less_bright = 50,
    //%block="not_so_bright"
    not_so_bright = 25,
    //%block="a_bit_faint"
    a_bit_faint = 10,
    //%block="default"
    normal = 0,
    //%block="barely_visible"
    barely_visible = 1
}

enum beepsOnOff {
    //%block="off"
    off = 0,
    //%block="on"
    on = 1

}


/**
 * Custom blocks
 */
//% weight=100 color=#01bc11 icon=""
namespace OrchestraMusician {

    /**
     * Setup your micro:bit as a musician
     * @param withNam a unique name that the conductors can shout to get your musicians attention
     */
    //% block
    export function JoinOrchestraAsMusician(withName: string): void {
        radio.setGroup(83)
        isMusician = true
        musicianName = withName
        radio.onDataPacketReceived(({ receivedString: receivedName, receivedNumber: value }) => {
            if (receivedName == musicianName) {
                if (outputMode == 0) { // no automated trigger handling
                    control.raiseEvent(1337, value)
                } else {
                    handleMusicianOutputMode(value) //decide what to do
                }
            }
            control.inBackground(() => {
                while (true) {
                    handleMusicianOffs()
                    basic.pause(10)
                }
            })
        })
    }

    //%block
    export function redirectNotesToPulsePins(one: DigitalPin, two: DigitalPin, three: DigitalPin, four: DigitalPin, five: DigitalPin, six: DigitalPin, seven: DigitalPin, eight: DigitalPin): void {
        outputMode = 1
        pinOutputRoutings[0] = one
        pinOutputRoutings[1] = two
        pinOutputRoutings[2] = three
        pinOutputRoutings[3] = four
        pinOutputRoutings[4] = five
        pinOutputRoutings[5] = six
        pinOutputRoutings[6] = seven
        pinOutputRoutings[7] = eight
    }

    //%block advanced=true
    export function redirectNotesToMcp23017(offset: number, firstSlaveAdress: number, secondSlaveAddress: number): void {
        //TODO
    }

    //%block advanced=true
    export function setNoteOnTime(duration: number): void {
        onTime = duration
        if (onTime > 100) {
            onTime = 100
        }
    }


    function handleMusicianOutputMode(noteToHandle: number) {  //this needs to be set up as a function that can be populated in block editor
        if (outputMode > 0) {
            switch (outputMode) {
                case 1: { // redirectNotesToPulsePins
                    triggerPinOutput(noteToHandle)
                    break;
                }
                case 2: { //redirectNotesToMCP23017
                    triggerMCP23017(noteToHandle)
                    break;
                }
            }
        }
        //put a switch case here to select how to handle the outputs, MCP32017 or hardwarepins or 

        if (noteToHandle < 25) {  //put this in an own plot to led function
            let column = noteToHandle / 5
            let row = noteToHandle % 5
            led.toggle(column, row)
        }
    }

    function triggerMCP23017(MCPOutputToTrigger: number) {
        //TODO
    }



    function triggerPinOutput(PINoutputToTrigger: number) {

        onTimer[PINoutputToTrigger] = input.runningTime()
        outputIsOn[PINoutputToTrigger] = true
        pins.digitalWritePin(pinOutputRoutings[PINoutputToTrigger], 1)
    }

    function unTriggerPinOutput(PINoutputToUnTrigger: number) {

        onTimer[PINoutputToUnTrigger] = input.runningTime()
        outputIsOn[PINoutputToUnTrigger] = true
        pins.digitalWritePin(pinOutputRoutings[PINoutputToUnTrigger], 0)
    }




    function handleMusicianOffs(): void {
        for (let i = 0; i < numberOfOutputs; i++) {
            if (outputIsOn[i]) {
                if (input.runningTime() - onTimer[i] > onTime) {
                    switch (outputMode) {
                        case 0: { //no automatic Handling of this stuff
                            break;
                        }
                        case 1: { // outputs go to pins, we need to turn them off
                            unTriggerPinOutput(i)
                            break;
                        }
                        case 2: { //ouputs go to MCP23017, we need to turn them off
                            //TODO make an untriggermcp23017() that can be called

                            break;
                        }
                        case 3: { //MIDI out ?

                            break;
                        }
                        case 4: {  //code registered with manually handle note offs block
                            control.raiseEvent(1338, i)
                            break;
                        }
                    }
                    basic.clearScreen()
                }
            }
        }
    }


    // FOR THE NEXT TWO FUNCTIONS I HAVE HIJACKED SOME BLOCK IDs
    // IF YOU KNOW HOW TO DO THIS PROPERLY PLEASE LET ME KNOW

    /**
 * Registers code to run when the musician receives a perticular note.
 * @param event event description
 * @param body code handler when event is triggered
 */

    //%blockId = devices_gamepad_event //% block="when musician receives note number|%event" icon="\uf152"
    export function onMusicianReceivedNote(note: number, body: Action) {
        onTimer[note] = input.runningTime()
        outputIsOn[note] = true
        control.onEvent(1337, note, body);
    }

    /**
     * Registers code to run when the device notifies about a particular event.
     * @param event event description
     * @param body code handler when event is triggered
     */
    //% help=devices/on-notified weight=26
    //% blockId=devices_device_info_event block="when it's time to turn off note|%event" icon="\uf10a"
    export function onTurnOff(note: number, body: Action) {
        control.onEvent(1338, note, body);
    }


}


/**
 * Custom blocks
 */
//% weight=100 color=#0fbc11 icon=""
namespace OrchestraConductor {
    /**
     * Retrigger the master clock back to 0
     */
    //% block advanced=true
    export function resetMasterClockSync() {
        lastClockTickTime = 0
        masterClockStep = -1
        runMasterClock()
    }


    /**
     * Setup this microbit as the master clock
     */
    //% block advanced=true
    export function setUpAsMasterClock(With: numberofSteps, at: number, bpmAndMetronomeBeeps: beepsOnOff, highSpeedLockMode: boolean) {
        radio.setGroup(84)
        masterTempo = at
        stepLengthms = 60000 / at
        stepLengthms = stepLengthms >> 1
        isMasterClock = true
        seqLength = With
        masterClockStep = -1
        lastStep = seqLength
        if (bpmAndMetronomeBeeps > 0) {
            metronome = true
        } else {
            metronome = false
        }
        if (highSpeedLockMode) {
            control.inBackground(() => {
                while (true) {
                    runMasterClock()
                    control.waitMicros(2000)
                }
            })
        }
    }


    /**
     * run the master clock and transmit some ticks and shit
     */
    //% block advanced=true
    export function runMasterClock(): void {
        if (isMasterClock) {
            //make sure master clock is setup
            if (input.runningTime() > lastClockTickTime + stepLengthms) {
                lastClockTickTime = input.runningTime()
                lastStep = masterClockStep
                masterClockStep += 1
                masterClockStep = masterClockStep % seqLength
                if (masterClockStep == 0) {
                    radio.setGroup(84)
                    radio.sendValue("s", stepLengthms)
                } else {
                    radio.setGroup(84)
                    radio.sendValue("t", masterClockStep)
                }
                handleMasterClockDisplay(masterClockStep, lastStep)
                if (metronome) {
                    if (masterClockStep > 0) {
                        music.playTone(440, 20)
                    } else {
                        music.playTone(880, 20)
                    }

                }
            }
            led.setBrightness(led.brightness() - 15)
        }
    }

    function handleMasterClockDisplay(thisStepIs: number, previousStepWas: number) {
        basic.showNumber(thisStepIs + 1, 0)
        led.setBrightness(255)

    }

    /**
     * Setup the routing of the 4 sequencer tracks
     */
    //% block
    export function setUpTrackRouting(channel: channels, Name: string, note: number) {
        channelIsSetup[channel] = true
        channelOutNames[channel] = Name
        channelOutNotes[channel] = note
    }

    /**
     * Run the sequencer clock 
     */
    //% block
    export function runSequencer() {
        if (sequencerExists) {
            if (extClock == 0) {
                clockTimer()
            }
            checkButts() //replace this with discrete functions
        }
    }

    /**
     * Select a channel
     */
    //% block
    export function changeSelectedChannel(by: number) {
        led.unplot(4, channelSelect)
        channelSelect = channelSelect + by
        while (channelSelect < 0) {
            channelSelect = channelSelect + 400
        }
        channelSelect = channelSelect % 4
        // serial.writeNumber(channelSelect)
        led.plot(4, channelSelect)
    }
    //NEEDS TO BE REPLACED WITH FUNCTIONS LIKE ABOTE
    function checkButts() {
        // BUTTON A
        if (input.buttonIsPressed(Button.A) && !(aWasPressed)) {
            aWasPressed = true
            led.unplot(4, channelSelect)
            channelSelect += 1
            channelSelect = channelSelect % 4
            led.plot(4, channelSelect)
        } else if (!(input.buttonIsPressed(Button.A)) && aWasPressed) {
            aWasPressed = false
        }
        // BUTTON B
        if (input.buttonIsPressed(Button.B) && !(bWasPressed)) {
            bWasPressed = true
            if (input.runningTime() - lastClockTickTime > (stepLengthms >> 2) * 3) {
                stepToWrite = (currentStep + 1) % seqLength
                earlyTrigger = true
            } else {
                stepToWrite = currentStep
                earlyTrigger = false
            }
            if (channelSelect == 0) {
                seqA[stepToWrite] = true
            } else if (channelSelect == 1) {
                seqB[stepToWrite] = true
            } else if (channelSelect == 2) {
                seqC[stepToWrite] = true
            } else if (channelSelect == 3) {
                seqD[stepToWrite] = true
            }
            triggerBuffer[channelSelect] = true
            if (!earlyTrigger) { //only handle tones if the button was pressed after the cursor got to the step we are writing to
                handleTones()
                if (channelIsSetup[channelSelect] && microBitID != 9876) {   //check that we have set up this channel and that we have set a microbit ID
                    send(channelOutNotes[channelSelect], channelOutNames[channelSelect])
                }
            }


            clearTriggerBuffer()
            updatePage()
        } else if (!(input.buttonIsPressed(Button.B)) && bWasPressed) {
            bWasPressed = false
        }
        // BOTH
        if (input.buttonIsPressed(Button.AB)) {
            for (let index = 0; index <= 16; index++) {
                seqA[index] = false
                seqB[index] = false
                seqC[index] = false
                seqD[index] = false
            }
            updatePage()
        }
    }



    function triggerChannel(channelToTrigger: number) {
        if (channelIsSetup[channelToTrigger]) {
            basic.pause(microBitID) //wait for this microbits timeslot to avoid radios talking ontop of eachother
            send(channelOutNotes[channelToTrigger], channelOutNames[channelToTrigger])
        }
    }






    function sendTriggersOut() {  //read the buffer and send any notes that need to be sent
        for (let m = 0; m <= 4 - 1; m++) {
            if (triggerBuffer[m]) {
                triggerChannel(m)
                //radio.sendValue("on", m + deviceID * 4)
            }
        }
    }

    function clearTriggerBuffer() {
        for (let outputToClear = 0; outputToClear <= 4 - 1; outputToClear++) {
            triggerBuffer[outputToClear] = false
        }
    }
    ///
    function handleTones() {
        music.setTempo(masterTempo)
        if (triggerBuffer[0]) {
            music.playTone(523, music.beat(BeatFraction.Sixteenth))
        }
        if (triggerBuffer[1]) {
            music.playTone(392, music.beat(BeatFraction.Sixteenth))
        }
        if (triggerBuffer[2]) {
            music.playTone(330, music.beat(BeatFraction.Sixteenth))
        }
        if (triggerBuffer[3]) {
            music.playTone(262, music.beat(BeatFraction.Sixteenth))
        }
    }


    function handleNoteOffs() {
        //TODO
    }

    let cursorBrightness = 5



    /**
     * Set the brightness of the cursor
     * @param With how many steps
     * @param stepsAndUse internal or external clock
     */
    //% block advanced=true
    export function setCursorBrightnes(to: brightnesses): void {
        cursorBrightness = to
    }


    function handleSeqCursor() {
        ledCursor = currentStep % 4
        offLed = ledCursor - 1
        if (offLed < 0) {
            offLed = 3
        }
        updatePage()
        //led.unplot(offLed, 4)
        if (seqLength <= 8) {
            handle2PartDisplay()
        } else {
            handle4PartDisplay()
        }
        //led.plot(ledCursor, 4)
        for (let num = 0; num <= 3; num++) {
            if (!led.point(ledCursor, num)) {
                led.plotBrightness(ledCursor, num, cursorBrightness)
            }

        }
    }


    function handle2PartDisplay() {
        led.unplot(offLed, 4)
        led.plot(ledCursor, 4)
        part = currentStep >> 2
        if (part < 1) {
            led.unplot(4, 4)
        } else {
            led.plot(4, 4)
        }
        // check if we are at a new part
        if (part != oldPart) {
            updatePage()
            oldPart = part
        }
    }
    /////////////////////////////////////////
    let partLed = 0
    function handle4PartDisplay() { //can actually handle up to 8 parts

        //handle2PartDisplay()
        part = currentStep >> 2
        if (part > 3) { // we are over 4 parts
            led.plot(4, 4)
            partLed = part - 4
        } else {
            led.unplot(4, 4)
            partLed = part
        }

        for (let o = 0; o <= 4 - 1; o++) {
            led.unplot(o, 4)
        }
        if (part != oldPart) {
            updatePage()
            oldPart = part
        }
        led.plot(partLed, 4)
    }

    function handle8partDisplay() {
        //TODO (a combination of 2part and 4part)
    }

    function handleStep() {
        handleSeqCursor()
        if (seqA[currentStep]) {
            triggerBuffer[0] = true
        }
        if (seqB[currentStep]) {
            triggerBuffer[1] = true
        }
        if (seqC[currentStep]) {
            triggerBuffer[2] = true
        }
        if (seqD[currentStep]) {
            triggerBuffer[3] = true
        }
        sendTriggersOut()
        handleTones()
        clearTriggerBuffer()
    }

    function handleLastStep() {
        if (seqA[lastStep]) {
            outPutToTrigger = 0
            handleNoteOffs()
        }
        if (seqB[lastStep]) {
            outPutToTrigger = 1
            handleNoteOffs()
        }
        if (seqC[lastStep]) {
            outPutToTrigger = 2
            handleNoteOffs()
        }
        if (seqD[lastStep]) {
            outPutToTrigger = 3
            handleNoteOffs()
        }
    }





    /**
     * Setup a sequencer
     * @param With how many steps
     * @param stepsAndUse internal or external clock
     */
    //% block
    export function makeASequencer(With: numberofSteps, stepsAndUse: internalExternal, andTempo: number): void {
        stepLengthms = 60000 / andTempo //find duration of 1bar
        stepLengthms = stepLengthms >> 1 //find duration of 1 2th
        seqLength = With
        lastStep = seqLength
        extClock = stepsAndUse
        sequencerExists = true
    }





    /**
     * Setup your micro:bit as a conductor
     * @param withId a unique ID so your conductor knows where to stand (and also so the conductors don't talk at the same time)
     */
    //% block
    export function conductOrchestra(withID: number): void {
        radio.setGroup(84) // tempo and clock ticks will be sent on radio group 84
        microBitID = withID
        basic.showNumber(microBitID)
        isMusician = false
        radio.onDataPacketReceived(({ receivedString: msgID, receivedNumber: receivedData }) => {
            handleExtClock(msgID, receivedData)
        })
    }


    /**
     * Send a command to the Microbit Orchestra
     */
    //%block
    export function send(note: number, to: string) {
        radio.setGroup(83) // change to the group where the musicians are
        radio.sendValue(to, note)
        radio.setGroup(84) // change back to the group where tempo and clock ticks are
    }
    /**
     * Send a local note out to hardware connected directly to this microbit
     */
    //%block
    export function sendHardware(note: number, to: string) {
        // LINK THIS TO THE HARDWARE OUTPUT PART OF THE RECEIVER
    }



    ////////////////////////////////////////

    let pageOffset = 0
    function updatePage() {
        pageOffset = part * 4
        for (let j = 0; j <= 4 - 1; j++) {
            if (seqA[j + pageOffset]) {
                led.plot(j, 0)
            } else {
                led.unplot(j, 0)
            }
        }
        for (let k = 0; k <= 4 - 1; k++) {
            if (seqB[k + pageOffset]) {
                led.plot(k, 1)
            } else {
                led.unplot(k, 1)
            }
        }
        for (let l = 0; l <= 4 - 1; l++) {
            if (seqC[l + pageOffset]) {
                led.plot(l, 2)
            } else {
                led.unplot(l, 2)
            }
        }
        for (let n = 0; n <= 4 - 1; n++) {
            if (seqD[n + pageOffset]) {
                led.plot(n, 3)
            } else {
                led.unplot(n, 3)
            }
        }
    }


    ///////////////////////////////////////

    function clockTimer() {
        // comment
        if (input.runningTime() >= lastClockTickTime + stepLengthms) {
            lastStep = currentStep
            lastClockTickTime = input.runningTime()
            currentStep += 1
            led.toggle(4, channelSelect)
            currentStep = currentStep % seqLength
            handleLastStep()
            handleStep()
        }
    }

    function handleExtClock(tickType: string, receivedData: number) {
        if (tickType == "t") {
            manuallyStepSequence()
        }
        else if (tickType == "s") {
            stepLengthms = receivedData
            masterTempo = (60000 / stepLengthms) >> 1
            currentStep = -1;
            manuallyStepSequence()
        }

    }

    function manuallyStepSequence() {
        lastStep = currentStep
        lastClockTickTime = input.runningTime()
        currentStep += 1
        led.toggle(4, channelSelect)
        currentStep = currentStep % seqLength
        handleLastStep()
        handleStep()
    }
}