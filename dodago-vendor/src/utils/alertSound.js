import { Vibration } from "react-native";

/**
 * Alert sound + vibration using expo-audio (SDK 56).
 * Uses createAudioPlayer() — the correct non-hook API for use outside React components.
 */

const VIBRATION_PATTERN = [0, 350, 120, 350, 120, 500];

let player         = null;
let loopIntervalId = null;
let isPlaying      = false;

export const playAlertSound = async () => {
  if (isPlaying) return;
  isPlaying = true;

  // Vibration works even in silent mode
  Vibration.vibrate(VIBRATION_PATTERN, true);

  try {
    const { createAudioPlayer, setAudioModeAsync } = require("expo-audio");

    await setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldRouteThroughEarpiece: false,
    });

    // createAudioPlayer is the correct imperative API (not a hook)
    player = createAudioPlayer(require("../../assets/alert.wav"));
    player.play();

    // Replay every 1.2s for looping effect
    loopIntervalId = setInterval(() => {
      try {
        if (player) {
          player.seekTo(0);
          player.play();
        }
      } catch {
        stopAlertSound();
      }
    }, 1200);
  } catch {
    // Audio unavailable — vibration still runs
  }
};

export const stopAlertSound = async () => {
  isPlaying = false;
  Vibration.cancel();

  if (loopIntervalId) {
    clearInterval(loopIntervalId);
    loopIntervalId = null;
  }

  if (player) {
    try {
      player.pause();
      player.remove();
    } catch {
      // Already released
    }
    player = null;
  }
};
