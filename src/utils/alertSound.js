let alertIntervalId = null;

const playAlertSound = (loop = false, urgency = "normal") => {
  if (typeof window === "undefined") return;

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  const playSequence = () => {
    const playTone = (freq, startTime, duration) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = urgency === "urgent" ? "square" : "sine";
      
      const volume = urgency === "urgent" ? 0.15 : 0.3;
      gainNode.gain.setValueAtTime(volume, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const now = audioContext.currentTime;
    
    if (urgency === "urgent") {
      playTone(1200, now, 0.08);
      playTone(1500, now + 0.08, 0.08);
      playTone(1800, now + 0.16, 0.08);
      playTone(2000, now + 0.24, 0.12);
    } else {
      playTone(880, now, 0.15);
      playTone(1100, now + 0.15, 0.15);
      playTone(1320, now + 0.3, 0.2);
    }
  };

  if (loop) {
    if (alertIntervalId) clearInterval(alertIntervalId);
    playSequence();
    const interval = urgency === "urgent" ? 800 : 1500;
    alertIntervalId = setInterval(playSequence, interval);
  } else {
    if (alertIntervalId) clearInterval(alertIntervalId);
    playSequence();
  }
};

const stopAlertSound = () => {
  if (alertIntervalId) {
    clearInterval(alertIntervalId);
    alertIntervalId = null;
  }
};

export { playAlertSound, stopAlertSound };