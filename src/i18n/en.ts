export const en = {
  app: {
    title: '⛈️ Thunder Trainer',
    subtitle: 'Controlled exposure for thunder-phobic dogs',
  },
  session: {
    start: 'Start training session',
    stop: 'Stop training session',
    tapToPlay: '🔇 Tap anywhere to start the sound',
  },
  thunder: {
    play: 'Play thunder clap',
    stop: 'Stop thunder clap',
  },
  status: {
    playing: '🔊 {file}',
    none: '⏸️ No thunder playing',
  },
  soundSelector: {
    group: 'Select thunder sound',
    label: 'Sound',
    current: '(currently playing: {n})',
    random: 'Random thunder sound',
    sound: 'Thunder sound {n}',
  },
  volume: {
    rain: '🌧️ Rain',
    thunder: '⚡ Thunder',
    rainVolume: 'Rain volume',
    thunderVolume: 'Thunder volume',
  },
  loading: {
    sounds: 'Loading sounds…',
    progress: '{loaded}/{total} thunder sounds',
  },
  errors: {
    audioTitle: '⚠️ Audio Error',
    audioHint: 'Make sure sound files (.mp3 or .wav) exist in',
    tryAgain: 'Try Again',
    genericTitle: 'Something went wrong',
    unknownError: 'Unknown error',
    reload: 'Reload App',
  },
  warning: {
    noSounds: '⚠️ No thunder sounds found. Add .mp3 or .wav files to',
  },
  rating: {
    region: "Rate your dog's reaction",
    question: "How did your dog react?",
    group: 'Reaction rating',
    veryCalm: 'Very calm',
    okay: 'Okay',
    nervous: 'Nervous',
    veryScared: 'Very scared',
    calm: '😊 Calm',
    scared: '😰 Scared',
    skip: 'Skip',
  },
  pwa: {
    update: 'An update is available. Reload now?',
  },
  languageSwitcher: {
    label: 'Language',
  },
}

export type Translation = typeof en;
