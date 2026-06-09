# 🧘‍♂️ Breathing Guide App

A simple web app I built to help maintain proper breathing during deep focus sessions like coding or problem-solving.

When I get fully focused, I tend to forget to breathe properly 😅 — so I created this tool to stay calm, focused, and consistent.

---

## ✨ Features

- Guided breathing patterns for different situations:
  - 🔲 **Box Breathing** – reduce stress and regain control
  - 🌙 **3–7–8 Breathing** – calm down quickly
  - 😌 **Relaxing Breathing** – slow breathing for relaxation
  - 🌊 **Coherent Breathing** – maintain steady focus
  - ⚙️ **Custom Mode** – define your own breathing rhythm

- 🔊 **Ambient sounds** — Rain, Waves, Wind; play/pause and choose per session
- ⏱️ **Session timer** — set a duration in minutes (0 = unlimited); session stops and saves automatically when time is up
- 🔔 **Phase cues (tones)** — short tones for inhale/hold/exhale; play in background on Android/desktop, paused on iOS when hidden

- 📺 **Picture-in-Picture (PiP) Mode** — Keep the breathing guide visible while working

---

## 🛠 Tech Stack

- Frontend: React
- State Management: React Hooks
- Browser APIs: Picture-in-Picture API, Screen Wake Lock API
- Styling: Tailwind CSS

---

## 🚀 How It Works

- Select a breathing pattern based on your current need
- Follow the visual guide for inhale, hold, and exhale
- Use PiP mode to keep the guide running while you work
- Toggle ambient sound with the audio button and choose Rain/Waves/Wind
- Set a session duration using the `Duration (minutes)` input (desktop: top controls, mobile: compact input in controls). Set to `0` for an unlimited session

---

## 💻 Platform & Background Behavior

- The app uses the native Screen Wake Lock API when available to keep the screen awake during sessions.
- When native wake-lock is unavailable (notably some iOS versions), the app uses an audio-based fallback to keep sessions active.
- Ambient audio is paused on iOS when the page is backgrounded to avoid noisy artifacts; ambient audio and phase cues continue on Android and desktop where browsers allow background audio.

### iOS specifics
- iOS Safari / PWA: background execution and PiP have platform limits. The app mutes/pauses ambient when backgrounded and resumes when you return to the app. Phase cues are blocked while hidden on iOS to avoid unexpected sounds.

### Desktop browsers
- Some browsers suspend Web Audio in background tabs. The app attempts to resume the WebAudio `AudioContext` for cues and falls back to a short WAV `HTMLAudioElement` beep when necessary so phase cues still play when minimized in most desktop browsers.

---

## 📦 Installation

```bash
git clone <your-repo-link>
cd project
npm install
npm run dev
```
