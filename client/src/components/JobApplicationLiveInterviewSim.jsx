import React, { useCallback, useEffect, useRef, useState } from 'react';
import useCountdown from '../hooks/useCountdown.js';

// Session 4 (Level 4) for the Applying for a Job category — a simulated live
// interview. A researcher-uploaded interview video (see the "Interviewer
// video" upload in the Stimuli tab, researcher/Stimuli.jsx) plays as the main
// scene, with the participant's own camera shown as a small picture-in-
// picture box in the upper-right corner, same self-view idea as
// PublicSpeakingOwnResponseSim.jsx but layered over the interviewer video
// instead of standing alone. Three questions are shown one at a time as a
// caption over the video (same caption-bar styling used for the Public
// Speaking teleprompter's script), 30 seconds each, auto-advancing — there's
// no way to answer early or skip ahead, same fixed-pace idea as the
// 30-second "think" step in PublicSpeakingOwnResponseSim.
//
// Camera/mic access is requested quietly in the background as soon as this
// loads (no separate "check your camera" screen), and nothing is ever
// recorded, saved, or sent anywhere — the camera is only ever used for the
// participant's own live self-view.
const QUESTIONS = [
  'What is your biggest weakness, and how are you working to improve it?',
  'How would you handle a disagreement with a coworker?',
  'What would you do if you made a mistake at work?',
];
const QUESTION_SECONDS = 30;

function useLatest(value) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

function NarrationBlock({ onDone, mediaError }) {
  const secondsLeft = useCountdown(10, 'interview-narration');
  const ready = secondsLeft <= 0;
  return (
    <div>
      <h3 className="sim-portal-section-title">Your Interview Is Starting</h3>
      <p className="sim-portal-message-body">
        An interviewer appears on screen for a short mock interview. You&rsquo;ll be asked three questions, one at a
        time, with 30 seconds to answer each one out loud.
      </p>
      <p className="sim-portal-message-body" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        Your camera and microphone are used so you can see yourself while you answer, but nothing you do here is
        ever recorded, saved, or sent anywhere.
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

function QuestionStage({ question, questionIndex, totalQuestions, interviewVideoUrl, attachSelfView, onDone }) {
  const secondsLeft = useCountdown(QUESTION_SECONDS, questionIndex);
  const onDoneRef = useLatest(onDone);

  useEffect(() => {
    if (secondsLeft === 0) onDoneRef.current();
  }, [secondsLeft, onDoneRef]);

  return (
    <div>
      <div className="sim-interview-stage">
        {interviewVideoUrl ? (
          <video className="sim-interview-video" src={interviewVideoUrl} autoPlay loop muted playsInline />
        ) : (
          <p className="stimulus-placeholder-text" style={{ margin: 0, padding: 24, color: '#fff' }}>
            [No interviewer video has been uploaded for this stimulus yet, a researcher needs to add one from the
            Stimuli tab in the Researcher Portal.]
          </p>
        )}
        <div className="sim-interview-pip">
          <video ref={attachSelfView} autoPlay muted playsInline />
        </div>
        <div className="sim-video-caption-bar">
          <p className="sim-video-caption-text">{question}</p>
        </div>
      </div>
      <p className="sim-portal-hint" style={{ textAlign: 'center' }}>
        Question {questionIndex + 1} of {totalQuestions} &middot; {secondsLeft}s remaining
      </p>
    </div>
  );
}

export default function JobApplicationLiveInterviewSim({ stimulus, onComplete }) {
  const [step, setStep] = useState('narration'); // narration | 0 | 1 | 2
  const [mediaError, setMediaError] = useState('');
  const interviewVideoUrl = stimulus?.interviewVideoUrl || null;

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const attachSelfView = useCallback((el) => {
    videoRef.current = el;
    if (el && streamRef.current) el.srcObject = streamRef.current;
  }, []);

  function stopLiveMedia() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  // Release the camera/mic no matter how the participant leaves this screen.
  useEffect(() => stopLiveMedia, []);

  // Ask for camera/mic once, quietly, as soon as this simulation loads, and
  // keep the same stream live through the narration and all three questions
  // — never re-prompting. If it's denied or unavailable, the interview still
  // runs — the participant just won't have a self-view.
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

  function handleQuestionDone(index) {
    if (index + 1 >= QUESTIONS.length) {
      stopLiveMedia();
      onComplete();
    } else {
      setStep(index + 1);
    }
  }

  return (
    <div className="sim-portal" role="group" aria-label="Simulated live job interview">
      <div className="sim-portal-disclaimer">Simulated mock interview, nothing you do here is recorded or saved</div>

      <div className="sim-readaloud-window">
        {step === 'narration' && <NarrationBlock mediaError={mediaError} onDone={() => setStep(0)} />}
        {typeof step === 'number' && (
          <QuestionStage
            question={QUESTIONS[step]}
            questionIndex={step}
            totalQuestions={QUESTIONS.length}
            interviewVideoUrl={interviewVideoUrl}
            attachSelfView={attachSelfView}
            onDone={() => handleQuestionDone(step)}
          />
        )}
      </div>
    </div>
  );
}
