import { Audio } from "expo-av";

// Dùng sound có sẵn từ expo-av system sounds
// Hoặc bundle file âm thanh vào assets/sounds/
let warningSound: Audio.Sound | null = null;
let criticalSound: Audio.Sound | null = null;

async function _loadSounds() {
  if (!warningSound) {
    const { sound } = await Audio.Sound.createAsync(
      require("../../../assets/sounds/warning.mp3"),
      { shouldPlay: false, volume: 0.5 }
    );
    warningSound = sound;
  }

  if (!criticalSound) {
    const { sound } = await Audio.Sound.createAsync(
      require("../../../assets/sounds/critical.mp3"),
      { shouldPlay: false, volume: 1.0 }
    );
    criticalSound = sound;
  }
}

export async function playAlertSound(level: string) {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,   // kêu ngay cả khi iPhone để silent
      staysActiveInBackground: false,
    });

    await _loadSounds();

    if (level === "CRITICAL") {
      await criticalSound?.replayAsync();
    } else {
      await warningSound?.replayAsync();
    }
  } catch (e) {
    console.log("[AlertSound] error:", e);
  }
}

export async function unloadSounds() {
  await warningSound?.unloadAsync();
  await criticalSound?.unloadAsync();
  warningSound = null;
  criticalSound = null;
}