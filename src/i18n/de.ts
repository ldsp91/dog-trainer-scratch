import type { Translation } from "./en";

export const de: Translation = {
  app: {
    title: "⛈️ Thunder Trainer",
    subtitle: "Gestufte Desensibilisierung für gewitterängstliche Hunde",
  },
  session: {
    start: "Trainingsdurchgang starten",
    stop: "Trainingsdurchgang beenden",
    tapToPlay: "🔇 Tippe irgendwo, um den Sound zu starten",
  },
  thunder: {
    play: "Donner abspielen",
    stop: "Donner stoppen",
  },
  status: {
    playing: "🔊 {file}",
    none: "⏸️ Kein Donner aktiv",
  },
  soundSelector: {
    group: "Donnersound auswählen",
    label: "Sound",
    current: "(gerade aktiv: {n})",
    random: "Zufälliger Donnersound",
    sound: "Donnersound {n}",
  },
  volume: {
    rain: "🌧️ Regen",
    thunder: "⚡ Donner",
    rainVolume: "Regen-Lautstärke",
    thunderVolume: "Donner-Lautstärke",
  },
  loading: {
    sounds: "Sounds werden geladen…",
    progress: "{loaded}/{total} Donnersounds",
  },
  errors: {
    audioTitle: "⚠️ Audio-Fehler",
    audioHint: "Stelle sicher, dass Sounddateien (.mp3 oder .wav) in",
    tryAgain: "Erneut versuchen",
    genericTitle: "Etwas ist schiefgelaufen",
    unknownError: "Unbekannter Fehler",
    reload: "App neu laden",
  },
  warning: {
    noSounds: "⚠️ Keine Donnersounds gefunden. Füge .mp3- oder .wav-Dateien zu",
  },
  rating: {
    region: "Reaktion deines Hundes bewerten",
    question: "Wie hat dein Hund reagiert?",
    group: "Bewertung der Reaktion",
    veryCalm: "Sehr ruhig",
    okay: "Okay",
    nervous: "Nervös",
    veryScared: "Sehr ängstlich",
    calm: "😊 Ruhig",
    scared: "😰 Ängstlich",
    skip: "Überspringen",
  },
  pwa: {
    update: "Ein Update ist verfügbar. Jetzt neu laden?",
  },
  languageSwitcher: {
    label: "Sprache",
  },
};
