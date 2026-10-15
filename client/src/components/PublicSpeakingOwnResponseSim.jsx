import React, { useCallback, useEffect, useRef, useState } from 'react';
import useCountdown from '../hooks/useCountdown.js';

// The final (Level 4) session for the Public Speaking category. Framed as a
// street-style news interview: a short narration setting the scene (a
// reporter stops you for a quick interview), then just the interview
// question with 30 seconds to think, an automatic 5-second countdown, and a
// 35-second "on air" segment with a live-broadcast look (a pulsing LIVE
// badge and a fake fluctuating viewer count).
//
// There's no separate "check your camera" preview screen before this starts
// (participants found the extra live self-view confusing) — camera/mic
// access is requested quietly in the background as soon as the simulation
// loads, and the narration screen just tells them plainly that nothing is
// recorded, saved, or sent anywhere.
//
// Nothing is ever actually recorded, saved, or sent anywhere — the camera/
// mic are only used for a live self-view mirror and a live microphone-level
// meter during the "on air" segment, both purely visual/in-the-moment, to
// make the segment feel real.
const QUESTION = 'What is something about yourself that you think people would be surprised to learn?';

// Every timer-driven step below reads onDone through a ref instead of
// putting it straight in an effect's dependency array — belt-and-suspenders
// against a parent re-render recreating the callback and tearing down a
// setTimeout/interval before it finishes.
function useLatest(value) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

// The live microphone-level meter used to keep its animated bar heights in
// state on the TOP-LEVEL simulation component. That state updated on every
// animation frame (~60 times a second) for as long as the camera/mic were
// live — which re-rendered the whole simulation, including the <video>
// element, that often. React was reattaching the video's callback ref on
// nearly every one of those re-renders, which is what caused the camera
// preview to stutter/glitch (most noticeably while scrolling, since a
// scroll's own repaint work landed on top of the same overloaded frame).
//
// Isolating the meter here means only this small leaf re-renders 60x/sec —
// the video element and the rest of the simulation are left alone entirely.
function LiveMicBars({ analyserRef }) {
  const [levels, setLevels] = useState(() => new Array(24).fill(4));
  const rafRef = useRef(null);

  useEffect(() => {
    const barCount = 24;
    function tick() {
      const analyser = analyserRef.current;
      if (analyser) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const binStep = Math.max(1, Math.floor(data.length / barCount));
        const next = [];
        for (let i = 0; i < barCount; i += 1) {
          const raw = data[i * binStep] / 255;
          next.push(Math.max(4, Math.sqrt(raw) * 100));
        }
        setLevels(next);
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [analyserRef]);

  return (
    <div className="sim-mic-bars" aria-label="Live microphone level">
      {levels.map((level, i) => (
        <span key={i} className="sim-mic-bar" style={{ height: `${level}%` }} />
      ))}
    </div>
  );
}

function NarrationBlock({ onDone, mediaError }) {
  const secondsLeft = useCountdown(10, 'narration');
  const ready = secondsLeft <= 0;
  return (
    <div>
      <h3 className="sim-portal-section-title">A Reporter Stops You</h3>
      <p className="sim-portal-message-body">
        &ldquo;Excuse me, sorry to catch you like this! We&rsquo;re putting together a quick segment for the local
        news, and we&rsquo;d love thirty seconds of your time. Nothing scripted, just an honest answer. Ready?&rdquo;
      </p>
      <p className="sim-portal-message-body" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        Your camera and microphone are used to make this feel like a live interview, but nothing you do here is ever
        recorded, saved, or sent anywhere.
      </p>
      {mediaError && <p className="error-text">{mediaError}</p>}
      <p className="sim-portal-hint">{ready ? 'You may continue.' : `You can continue in ${secondsLeft}s`}</p>
      <div className="btn-row">
        <button type="button" className="btn btn-primary" disabled={!ready} onClick={onDone}>
          Continue
        </button>
      </div>
    </div>
  );
}

function QuestionBlock({ question, onDone }) {
  const secondsLeft = useCountdown(30, 'question');
  const onDoneRef = useLatest(onDone);

  useEffect(() => {
    if (secondsLeft === 0) onDoneRef.current();
  }, [secondsLeft, onDoneRef]);

  return (
    <div className="sim-question-only">
      <div>
        <p className="sim-response-question">{question}</p>
        {/* A visible countdown so it's clear time is actually being given to
            think — it stays quiet/secondary so the question is still the
            focus of the screen. */}
        <p className="sim-portal-hint" style={{ textAlign: 'center' }}>
          Take a moment to think, you&rsquo;ll begin in {secondsLeft}s
        </p>
      </div>
    </div>
  );
}

function CountdownBlock({ onDone }) {
  const [n, setN] = useState(5);
  const onDoneRef = useLatest(onDone);

  useEffect(() => {
    if (n <= 0) {
      onDoneRef.current();
      return undefined;
    }
    const timer = setTimeout(() => setN((v) => v - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  return (
    <div className="sim-countdown-wrap">
      <div className="sim-countdown-circle">{n}</div>
      <p className="sim-portal-hint" style={{ textAlign: 'center', marginTop: 10 }}>
        Get ready&hellip;
      </p>
    </div>
  );
}

function RecordingBlock({ attachVideo, analyserRef, onDone }) {
  const [secondsLeft, setSecondsLeft] = useState(35);
  const [viewers, setViewers] = useState(() => 20000 + Math.floor(Math.random() * 10000));
  const onDoneRef = useLatest(onDone);

  // 35-second "on air" countdown, auto-finishing the segment at 0.
  useEffect(() => {
    if (secondsLeft <= 0) {
      onDoneRef.current();
      return undefined;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  // A fake live-viewer count that drifts up and down within ~20,000-30,000,
  // purely for atmosphere — no real data behind it.
  useEffect(() => {
    const interval = setInterval(() => {
      setViewers((v) => {
        const delta = Math.floor(Math.random() * 900) - 450;
        return Math.min(30000, Math.max(20000, v + delta));
      });
    }, 900);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="sim-live-frame">
        <video ref={attachVideo} autoPlay muted playsInline className="sim-live-video" />
        <span className="sim-live-badge">
          <span className="sim-live-dot" aria-hidden="true" /> LIVE
        </span>
        <span className="sim-live-viewers-badge">{viewers.toLocaleString()} watching</span>
      </div>
      <LiveMicBars analyserRef={analyserRef} />
      <div className="sim-countdown-wrap sim-countdown-wrap--small">
        <div className="sim-countdown-circle sim-countdown-circle--small">{secondsLeft}</div>
      </div>
    </div>
  );
}

export default function PublicSpeakingOwnResponseSim({ onComplete }) {
  const [step, setStep] = useState('narration'); // narration | question | countdown | recording

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);

  const [mediaError, setMediaError] = useState('');

  // A callback ref (rather than a plain object ref) so that whenever the
  // recording screen's <video> element mounts, the live stream is
  // reattached immediately. Wrapped in
  // useCallback with an empty dependency array so the ref callback itself
  // stays the SAME function across re-renders — otherwise React tears down
  // and reattaches it (and the stream) on every re-render, which is what
  // made the camera preview glitch/stutter.
  const attachVideo = useCallback((el) => {
    videoRef.current = el;
    if (el && streamRef.current) el.srcObject = streamRef.current;
  }, []);

  function stopLiveMedia() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
  }

  // Release the camera/mic no matter how the participant leaves this screen.
  useEffect(() => stopLiveMedia, []);

  // Ask for camera/mic once, quietly in the background as soon as this
  // simulation loads (there's no separate "check your camera" screen the
  // participant has to get through first), and keep the same stream live
  // through every later step — never re-prompting. If it's denied or
  // unavailable, the segment still runs — the recording step just won't have
  // a live self-view.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContextClass();
        audioCtxRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.35;
        source.connect(analyser);
        analyserRef.current = analyser;
      } catch (err) {
        if (!cancelled) {
          setMediaError('We couldn’t access your camera/microphone. You can still continue without it.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleFinishSegment() {
    stopLiveMedia();
    onComplete();
  }

  return (
    <div className="sim-portal" role="group" aria-label="Simulated live news interview segment">
      <div className="sim-portal-disclaimer">Simulated live interview segment, nothing you do here is recorded or saved</div>

      <div className="sim-readaloud-window">
        {step === 'narration' && <NarrationBlock mediaError={mediaError} onDone={() => setStep('question')} />}
        {step === 'question' && <QuestionBlock question={QUESTION} onDone={() => setStep('countdown')} />}
        {step === 'countdown' && <CountdownBlock onDone={() => setStep('recording')} />}
        {step === 'recording' && (
          <RecordingBlock attachVideo={attachVideo} analyserRef={analyserRef} onDone={handleFinishSegment} />
        )}
      </div>
    </div>
  );
}
