# Product Requirements Document

## Overview

A simple web app that gives dog owners with thunder-phobic dogs predictable, controllable thunder exposure — solving the frustration of unpredictable YouTube thunder videos by providing a one-tap trigger with consistent volume and seamless rain ambience.

## Context

- **Mode:** Builder Mode
- **Goal:** Having fun / side project — solving a real personal problem
- **Product stage:** MVP
- **Target user:** Dog owners with thunder-phobic dogs (starting with the project owner and their dog), validated by a professional dog trainer
- **Narrowest wedge:** A web app with a big trigger button for thunder claps and a rain volume slider

## Features

### 1. Rain Loop

**Priority:** 1

**User story:** As a dog owner, I want to start a continuous rain loop so that the background noise is predictable and consistent during training.

**Acceptance criteria:**
- [ ] Rain plays continuously in a seamless loop once the session starts
- [ ] Rain continues playing when a thunder clap is triggered (no interruption)
- [ ] Rain fades in smoothly when session starts
- [ ] Rain fades out smoothly when session stops

### 2. Thunder Trigger

**Priority:** 2

**User story:** As a dog owner, I want to tap a big button to play a thunder clap at a consistent volume so that I can control the exposure precisely.

**Acceptance criteria:**
- [ ] Tapping the trigger button plays a thunder clap instantly (no perceptible lag)
- [ ] Thunder clap plays alongside the rain loop (not instead of it)
- [ ] Thunder clap is randomly selected from a pool of available thunder sounds
- [ ] Anti-spam: button prevents rapid-fire triggering (minimum time between claps)
- [ ] If session is stopped mid-clap, the thunder clap does not replay when session is restarted
- [ ] Supports multiple thunder sound clips in the pool (number TBD)

### 3. Volume Sliders

**Priority:** 3

**User story:** As a dog owner, I want independent rain and thunder volume sliders so that I can dial in the exact intensity my dog can handle.

**Acceptance criteria:**
- [ ] Rain volume slider controls only the rain loop (0–100 range)
- [ ] Thunder volume slider controls only thunder clap volume (0–100 range)
- [ ] Adjusting one slider does not affect the other
- [ ] Volume settings persist when stopping and restarting the session

### 4. Session Start/Stop

**Priority:** 1

**User story:** As a dog owner, I want a single play/stop button to begin and end my training session.

**Acceptance criteria:**
- [ ] Tapping play starts the rain loop with a smooth fade-in
- [ ] Tapping stop immediately stops all sounds (no questions, no delay)
- [ ] After stopping, all volume settings are preserved and restored on next play
- [ ] If stopped mid-thunder-clap, only the rain continues on restart (thunder does not replay)

### 5. Thunder Reaction Rating

**Priority:** 4

**User story:** As a dog owner, I want to optionally rate my dog's reaction to each thunder clap using a 1–5 star scale so that I can track what intensity is too much.

**Acceptance criteria:**
- [ ] After each thunder clap, a 1–5 star rating interface appears
- [ ] Rating is optional — user can skip it
- [ ] Rating is tied to the most recent thunder clap
- [ ] Star rating is visually clear and easy to tap on a mobile device

## Scope

### In Scope
- Rain loop with fade in/out
- Thunder trigger with random sound selection
- Independent rain and thunder volume sliders (0–100)
- Session start/stop with persistent settings
- Per-clap 1–5 star reaction rating
- Mobile-first web interface

### Out of Scope
- Sound library management (adding/removing audio clips in-app)
- User accounts or profiles
- Multi-user support
- Native mobile app (v1 is web only)
- Session history, analytics, or progress tracking
- Admin panel
- Sound preview before playing in a session
- Sharing or exporting ratings
- Browser notifications or timers
- Dark mode / theme switching

## Constraints

- **Time:** No hard deadlines
- **Platform:** Mobile-first web, exclusively used on mobile phones
- **Audio:** Sound files hosted on server; audio must sound realistic
- **Team:** Solo builder
- **Hosting:** Local hosting for development and initial use

## Success Metrics

- Dog stays calm during a training session without panicking
- Dog trainer validates the method and app works effectively

## Non-Functional Requirements

- **Performance:** Instant audio playback on tap — no perceptible lag between trigger press and sound
- **Reliability:** No crashes, no mid-session audio failures — the app must be dependable during training
- **Usability:** Mobile-first design with a large, easy-to-hit trigger button; realistic audio quality
- **Scalability:** Not a concern for v1 — single user, single dog

## Open Questions

- How many thunder sound clips should be in the initial pool?
- What's the ideal anti-spam delay between thunder triggers?
- What's the ideal fade-in/fade-out duration for start/stop?
- Where are the sound files stored on the server, and how should they be loaded?
- What format and quality should the audio files be?
- After rating, how will the user view accumulated data (if at all)?
