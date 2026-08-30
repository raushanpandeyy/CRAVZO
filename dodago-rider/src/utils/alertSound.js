import { Audio } from "expo-av";
import { Vibration } from "react-native";

// Two-tone ascending beep (880 Hz → 1100 Hz), 0.4 s, PCM WAV.
// Bundled locally — no network request, works offline.
const ALERT_SOUND_ASSET = require("../../assets/alert.wav");

// Vibration pattern (ms): [wait, buzz, wait, buzz, wait, buzz]
const VIBRATION_PATTERN = [0, 350, 120, 350, 120, 500];

let soundObject = null;
let loopIntervalId = null;
let isPlaying = false;

/**
 * Start looping alert beep + vibration.
 * Call when the new-order popup appears.
 * Safe to call multiple times — ignored if already playing.
 */
export const playAlertSound = async () => {
  if (isPlaying) return;
  isPlaying = true;

  // Vibration: works even in Android silent mode, no permission required.
  Vibration.vibrate(VIBRATION_PATTERN, true /* repeat */);

  try {
    // Ensure audio plays even when iOS device is on the silent/ring switch.
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
    });

    const { sound } = await Audio.Sound.createAsync(
      ALERT_SOUND_ASSET,
      { shouldPlay: true, isLooping: false, volume: 1.0 }
    );
    soundObject = sound;

    // Replay every 1.2 s — more reliable than isLooping on older Android devices.
    loopIntervalId = setInterval(async () => {
      try {
        if (soundObject) await soundObject.replayAsync();
      } catch {
        stopAlertSound();
      }
    }, 1200);
  } catch {
    // Audio unavailable (e.g. emulator without audio support) — vibration still runs.
  }
};

/**
 * Stop the alert beep + vibration.
 * Call when the rider accepts, rejects, or dismisses the order popup.
 */
export const stopAlertSound = async () => {
  isPlaying = false;

  Vibration.cancel();

  if (loopIntervalId) {
    clearInterval(loopIntervalId);
    loopIntervalId = null;
  }

  if (soundObject) {
    try {
      await soundObject.stopAsync();
      await soundObject.unloadAsync();
    } catch {
      // Already unloaded — ignore.
    }
    soundObject = null;
  }
};
