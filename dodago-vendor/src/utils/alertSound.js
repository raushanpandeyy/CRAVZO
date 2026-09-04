import { Vibration } from "react-native";

/**
 * Alert sound + vibration for vendor app (expo-audio SDK 56).
 *
 * The alert.wav is a 10-second loud beep-beep-pause loop.
 * We play it once fully (it IS 10 seconds) and then replay from
 * the start so the sound keeps going until explicitly stopped.
 *
 * Volume is set to maximum (1.0) and playsInSilentModeIOS is
 * enabled so the sound cuts through even on silent/vibrate mode.
 */

// Vibration pattern: urgent repeating pulses
const VIBRATION_PATTERN = [0, 300, 100, 300, 100, 300, 200, 500];

// How long the WAV is — we restart just before it ends to avoid silence gaps
const WAV_DURATION_MS = 10_000;
const RESTART_BEFORE_END_MS = 200; // restart 200ms before WAV finishes

let player         = null;
let loopTimerId    = null;
let isPlaying      = false;

export const playAlertSound = async () => {
  if (isPlaying) return;
  isPlaying = true;

  // Vibration works even in silent mode — repeat=true keeps it going
  Vibration.vibrate(VIBRATION_PATTERN, true);

  try {
    const { createAudioPlayer, setAudioModeAsync } = require("expo-audio");

    // Force audio to play through the main speaker at full volume,
    // even when the device is on silent/vibrate mode
    await setAudioModeAsync({
      playsInSilentModeIOS:       true,
      shouldRouteThroughEarpiece: false,   // use speaker, not earpiece
      allowsRecordingIOS:         false,
    });

    // Create player at full volume
    player = createAudioPlayer(require("../../assets/alert.wav"));
    player.volume = 1.0;   // max volume
    player.play();

    // Schedule restart loop — replay the full 10s WAV over and over
    const scheduleRestart = () => {
      loopTimerId = setTimeout(async () => {
        if (!isPlaying || !player) return;
        try {
          await player.seekTo(0);
          player.play();
        } catch {
          // Player may have been released — stop cleanly
          stopAlertSound();
          return;
        }
        scheduleRestart(); // schedule next restart
      }, WAV_DURATION_MS - RESTART_BEFORE_END_MS);
    };

    scheduleRestart();
  } catch {
    // expo-audio unavailable — vibration still runs
  }
};

export const stopAlertSound = async () => {
  isPlaying = false;
  Vibration.cancel();

  if (loopTimerId) {
    clearTimeout(loopTimerId);
    loopTimerId = null;
  }

  if (player) {
    try {
      player.pause();
      player.remove();
    } catch {
      // Already released — ignore
    }
    player = null;
  }
};
