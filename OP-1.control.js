/*
 *
 * OP-1.control.js
 *
 * Author: Maurice T. Meyer
 * E-Mail: maurice@lavireo.com
 *
 * Date: 25-08-2016
 */


loadAPI(1);

host.defineController("Teenage Engineering", "OP-1", "2.0-beta", "befd66e0-6abd-11e6-bdf4-0800200c9a66");
host.defineMidiPorts(1, 1);

var Ctrl = {
  position: '1.1.1'
}

// OP1
var OP1 = {
  //
  // Number of tracks
  NUM_TRACKS:        13,
  NUM_ROWS:          1,
  NUM_MODES:         4,

  //
  // Modes ID's
  MODE_CLIP:         0,
  MODE_PERFORM:      1,
  MODE_ARRANGE:      2,
  MODE_MIXER:        3,

  //
  // Encoders
  ENCODER_1:         1,
  ENCODER_2:         2,
  ENCODER_3:         3,
  ENCODER_4:         4,

  HELP_BUTTON:       5,
  METRONOME_BUTTON:  6,

  MODE_1_BUTTON:     7,
  MODE_2_BUTTON:     8,
  MODE_3_BUTTON:     9,
  MODE_4_BUTTON:     10,

  T1_BUTTON:         11,
  T2_BUTTON:         12,
  T3_BUTTON:         13,
  T4_BUTTON:         14,

  ARROW_UP_BUTTON:   15,
  ARROW_DOWN_BUTTON: 16,
  SCISSOR_BUTTON:    17,

  SS1_BUTTON:        50,
  SS2_BUTTON:        51,
  SS3_BUTTON:        52,
  SS4_BUTTON:        21,
  SS5_BUTTON:        22,
  SS6_BUTTON:        23,
  SS7_BUTTON:        24,
  SS8_BUTTON:        25,

  REC_BUTTON:        38,
  PLAY_BUTTON:       39,
  STOP_BUTTON:       40,

  LEFT_ARROW:        41,
  RIGHT_ARROW:       42,
  SHIFT_BUTTON:      43,

  MICRO:             48,
  COM:               49,

  isMode:            1,
  isMetronom:        false,

  ENCODER_START_CC:  1,
  ENCODER_END_CC:    4,

  LOWEST_CC:         1,
  HIGHEST_CC:        119,


  ID_MIDI:              'f0 7e 7f 06 01 f7',
  INIT_MIDI:            'f0 00 20 76 00 01 02 f7',
  EXIT_MIDI:            'f0 00 20 76 00 01 00 f7',
  TEXT_INIT_MIDI:       'f0 00 20 76 00 03',
  TEXT_EXIT_MIDI:       'f7',
  TEXT_COLOR_INIT_MIDI: 'f0 00 20 76 00 04'
};

function execMidi(sequence)
{
  host.getMidiOutPort(0).sendSysex(sequence);
}

// Initialize
function init() {
  // MIDI ports
  host.getMidiInPort(0).setMidiCallback(onMidiPort);
  generic = host.getMidiInPort(0).createNoteInput("MIDI Keyboard", "??????");
  generic.setShouldConsumeEvents(false);

  //
  // Init
  execMidi(OP1.INIT_MIDI)
  showText(' ');

  //
  // Create host objects
  application = host.createApplication();
  transport = host.createTransport();
  masterTrack_0 = host.createMasterTrack(0);
  cursorTrack = host.createCursorTrackSection(4, 5);
  trackBank = host.createTrackBankSection(8, 4, 0);
  cursorDevice = host.createCursorDeviceSection(8);
  userControls = host.createUserControlsSection(OP1.HIGHEST_CC - OP1.LOWEST_CC + 1 - 8);

  transport.getPosition().addTimeObserver(".", 1, 2, 2, 0, onTimeUpdate);
}

function isInDeviceParametersRange(cc)
{
  return cc >= OP1.ENCODER_START_CC && cc <= OP1.ENCODER_END_CC;
}

function onMidiPort(status, data1, data2)
{
  if (OP1.isMode == OP1.MODE_MIXER)
  {
    switch (data1) {
      case OP1.ENCODER_1: // Volume selected track
        cursorTrack.getVolume().set(data2, 128);
        break;

      case OP1.ENCODER_2: // Pan selected track
        cursorTrack.getPan().set(data2, 128);
        break;

      case OP1.ENCODER_3: // Send 1 selected track
        cursorTrack.getSend(0).set(data2, 128);
        break;

      case OP1.ENCODER_4: // Send 2 selected track
        OP1.isShift ? transport.getTempo().setRaw(data2 + 49) : masterTrack_0.getVolume().set(data2, 128);
        break;
    }
  }

  //
  // Buttons
  if (data2 > 0)
    switch (data1)
    {
      //
      // Modes
      case OP1.MODE_1_BUTTON:
        OP1.isMode  = 0;
        update_display_clip_mode();
        host.showPopupNotification("Clip Mode");
        break;

      case OP1.MODE_2_BUTTON:
        OP1.isMode  = 1;
        update_display_perform_mode();
        host.showPopupNotification("Performance Mode");
        break;

      case OP1.MODE_3_BUTTON:
        OP1.isMode  = 2;
        update_display_arrange_mode();
        host.showPopupNotification("Arrange Mode");
        break;

      case OP1.MODE_4_BUTTON:
        OP1.isMode  = 3;
        update_display_mixer_mode();
        host.showPopupNotification("Mixer Mode");
        break;


      //
      // Up/Down/Left/Right
      case OP1.ARROW_UP_BUTTON:
        cursorAction(data1);
        break;

      case OP1.ARROW_DOWN_BUTTON:
        cursorAction(data1);
        break;

      case OP1.LEFT_ARROW:
        if (OP1.isShift)
        {

        }
        break;

      case OP1.RIGHT_ARROW:
        if (OP1.isShift)
        {

        }
        break;


      //
      // Play/Pause/Rec
      case OP1.REC_BUTTON:
        OP1.isShift ? cursorTrack.getArm().toggle() : transport.record();
        break;

      case OP1.PLAY_BUTTON:
        OP1.isShift ? cursorTrack.getSolo().toggle() : transport.play();
        break;

      case OP1.STOP_BUTTON:
        OP1.isShift ? cursorTrack.getMute().toggle() : transport.stop()
        break;


      //
      // Metronom
      case OP1.METRONOME_BUTTON:
        OP1.isMetronom = !OP1.isMetronom;
        transport.setMetronomeValue(OP1.isMetronom ? 128 : 0, 128);
        host.showPopupNotification("Metronom: " + (OP1.isMetronom ? 'On' : 'Off'));
        break;
    }


  //
  // Shift
  switch (data1)
  {
    case OP1.SHIFT_BUTTON:
      OP1.isShift = data2 > 0;
      break;
  }
}

function onTimeUpdate(value)
{
  Ctrl.position = value;
  if (OP1.isMode == OP1.MODE_ARRANGE) {
    update_display_arrange_mode();
  }
}

function showText(text)
{
  var d = trim(text);
  var l = d.length;
  execMidi(OP1.TEXT_INIT_MIDI + ' ' + d2h(l) + d.toHex(l) + OP1.TEXT_EXIT_MIDI);
}

function cursorAction(cursorButton)
{
  // TRACK
  if (OP1.isMode == OP1.MODE_ARRANGE) {
    switch(cursorButton)
    {
      case OP1.ARROW_UP_BUTTON:
        application.arrowKeyUp();
        break;

      case OP1.ARROW_DOWN_BUTTON:
        application.arrowKeyDown();
        break;
    }
  }
  // MIXER
  if (OP1.isMode == OP1.MODE_MIXER)
  {
    switch(cursorButton)
    {
      case OP1.ARROW_UP_BUTTON:
        application.focusPanelAbove();
        break;

      case OP1.ARROW_DOWN_BUTTON:
        application.focusPanelBelow();
        break;
    }
  }
}


function update_display_clips()
{
  count    = 0;
  colors   = [];
  length   = [];
  sequence = [];
}

function update_display_perform_mode()
{
  showText("perform\rmode"); 
}

function update_display_clip_mode()
{
  showText("sel. clip\r"); 
}

function update_display_arrange_mode()
{
  showText("song pos,\r" + Ctrl.position);
}

function update_display_mixer_mode()
{
  showText("sel. track\r");
}



function trim(str) {
  str = str.replace(/^\s+/, '');
  for (var i = str.length - 1; i >= 0; i--) {
    if (/\S/.test(str.charAt(i))) {
      str = str.substring(0, i + 1);
      break;
    }
  }

  return str;
}

function d2h(d)
{
    var hex = Number(d).toString(16);
    if (hex.length < 2) {
        hex = "0" + hex;
    }

    return hex;
}

function exit()
{
  //
  // Exit
  execMidi(OP1.EXIT_MIDI);
}