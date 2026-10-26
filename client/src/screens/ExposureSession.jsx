import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import Slider from '../components/Slider.jsx';
import AdmissionsPortalSim from '../components/AdmissionsPortalSim.jsx';
import CollegeAdmissionsNarrativeSim from '../components/CollegeAdmissionsNarrativeSim.jsx';
import TextThreadSim from '../components/TextThreadSim.jsx';
import FinancialAidEmailSim from '../components/FinancialAidEmailSim.jsx';
import CollegeAdmissionsRejectionEmailSim from '../components/CollegeAdmissionsRejectionEmailSim.jsx';
import CollegeFriendGroupChatRejectionSim from '../components/CollegeFriendGroupChatRejectionSim.jsx';
import PublicSpeakingNarrativeSim from '../components/PublicSpeakingNarrativeSim.jsx';
import PublicSpeakingAudienceSim from '../components/PublicSpeakingAudienceSim.jsx';
import PublicSpeakingTeleprompterSim from '../components/PublicSpeakingTeleprompterSim.jsx';
import PublicSpeakingOwnResponseSim from '../components/PublicSpeakingOwnResponseSim.jsx';
import TestAnxietyNarrativeSim from '../components/TestAnxietyNarrativeSim.jsx';
import TestAnxietyEasyTestSim from '../components/TestAnxietyEasyTestSim.jsx';
import TestAnxietyModerateTestSim from '../components/TestAnxietyModerateTestSim.jsx';
import TestAnxietyDifficultTestSim from '../components/TestAnxietyDifficultTestSim.jsx';
import JobApplicationNarrativeSim from '../components/JobApplicationNarrativeSim.jsx';
import JobApplicationResumeSim from '../components/JobApplicationResumeSim.jsx';
import JobApplicationOfferNegotiationSim from '../components/JobApplicationOfferNegotiationSim.jsx';
import JobApplicationLiveInterviewSim from '../components/JobApplicationLiveInterviewSim.jsx';
import { useStudy } from '../context/StudyContext.jsx';
import { api } from '../api.js';
import { getFearTopicPhrase } from '../utils/fearTopics.js';

// Interactive stimuli are keyed by the value stored in stimulus.content when
// contentType === 'simulation'. Add new interactive scenarios here.
const SIMULATIONS = {
  job_application_narrative_intro: JobApplicationNarrativeSim,
  job_application_resume_form: JobApplicationResumeSim,
  job_application_offer_negotiation: JobApplicationOfferNegotiationSim,
  job_application_live_interview: JobApplicationLiveInterviewSim,
  admissions_portal_uf: AdmissionsPortalSim,
  college_admissions_narrative_intro: CollegeAdmissionsNarrativeSim,
  college_friend_group_chat: TextThreadSim,
  financial_aid_status_uf: FinancialAidEmailSim,
  college_admissions_rejection_email: CollegeAdmissionsRejectionEmailSim,
  college_friend_group_chat_rejection: CollegeFriendGroupChatRejectionSim,
  public_speaking_narrative_intro: PublicSpeakingNarrativeSim,
  public_speaking_audience_readaloud: PublicSpeakingAudienceSim,
  public_speaking_teleprompter: PublicSpeakingTeleprompterSim,
  public_speaking_own_response: PublicSpeakingOwnResponseSim,
  test_anxiety_narrative_intro: TestAnxietyNarrativeSim,
  test_anxiety_easy_test: TestAnxietyEasyTestSim,
  test_anxiety_moderate_test: TestAnxietyModerateTestSim,
  test_anxiety_difficult_test: TestAnxietyDifficultTestSim,
};

function StimulusDisplay({ stimulus, studyCode, onSimulationComplete }) {
  if (!stimulus) {
    return <p className="stimulus-placeholder-text">[No approved stimulus configured for this level yet.]</p>;
  }
  const { contentType, content, caption } = stimulus;

  if (contentType === 'simulation') {
    const SimComponent = SIMULATIONS[content];
    if (!SimComponent) {
      return (
        <p className="stimulus-placeholder-text">
          [Unknown simulation "{content}", check the Stimuli editor in the researcher dashboard.]
        </p>
      );
    }
    return (
      <div>
        {caption && <p style={{ fontWeight: 600, marginBottom: 12 }}>{caption}</p>}
        <SimComponent stimulus={stimulus} studyCode={studyCode} onComplete={onSimulationComplete} />
      </div>
    );
  }

  return (
    <div>
      {caption && <p style={{ fontWeight: 600, marginBottom: 12 }}>{caption}</p>}
      {contentType === 'image' && <img src={content} alt={caption || 'Exposure stimulus'} />}
      {contentType === 'video' && (
        <video src={content} controls autoPlay muted playsInline>
          Your browser does not support embedded video.
        </video>
      )}
      {contentType === 'url' && (
        <a href={content} target="_blank" rel="noreferrer">
          Open approved stimulus in a new tab
        </a>
      )}
      {(contentType === 'placeholder' || contentType === 'text') && (
        <p className="stimulus-placeholder-text">{content}</p>
      )}
    </div>
  );
}

export default function ExposureSession() {
  const navigate = useNavigate();
  const { sessionNumber: sessionParam } = useParams();
  const sessionNumber = Number(sessionParam);
  const { participant, categoryName } = useStudy();

  const [plan, setPlan] = useState(null);
  const [completedLevels, setCompletedLevels] = useState([]);
  const [levelIdx, setLevelIdx] = useState(0);
  const [phase, setPhase] = useState('loading'); // loading | pre | stimulus | questions | done
  const [preRating, setPreRating] = useState(5);
  const [postRating, setPostRating] = useState(5);
  const [expectedText, setExpectedText] = useState('');
  const [actualText, setActualText] = useState('');
  // Free-text reflection ("how have things been since your last session") —
  // collected and stored alongside the rest of the exposure response.
  const [reflectionText, setReflectionText] = useState('');
  // Set only by the Public Speaking Session 4 simulation once its recording
  // has been uploaded; included in the exposure-response submit payload
  // below, and reset between levels/sessions like everything else here.
  const [recordingUrl, setRecordingUrl] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  // Two separate error states, on purpose:
  //  - loadError: something fatal happened before there's anything to show
  //    (the session plan itself failed to load) — there's no form underneath
  //    to keep visible, so replacing the whole card with a message is the
  //    only option.
  //  - error: an inline reminder shown at the bottom of whatever the
  //    participant is currently looking at — an unanswered required question,
  //    or a submission that failed. This must NEVER blank out the form
  //    itself; the whole point is that the participant can still see (and
  //    fix) what they were doing while the reminder sits below it.
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const timerRef = useRef(null);
  // Note on the rating sliders below: unlike a blank textbox or an
  // unselected multiple-choice option, a 1-10 slider always has a real,
  // valid value on screen — there's no "empty" state to require. An earlier
  // version tried to additionally require the participant to physically drag
  // the slider before counting it as "answered," but that broke things
  // whenever a participant's honest answer happened to already match the
  // default (5): they'd click Continue, and even though the correct answer
  // was right there on screen, they'd be told to "answer the question above"
  // and get stuck. So sliders are always treated as answered; only the free-
  // text fields below (which genuinely start out empty) are required.

  const topic = getFearTopicPhrase(participant?.fearCategoryId, categoryName);

  useEffect(() => {
    if (!participant) return;
    let cancelled = false;
    (async () => {
      try {
        const [planResult, responses] = await Promise.all([
          api.getSessionPlan(sessionNumber, participant.fearCategoryId, participant.isDemo),
          api.getSessionResponses(participant.studyCode, sessionNumber),
        ]);
        if (cancelled) return;
        setPlan(planResult);
        const done = responses.map((r) => r.exposure_level);
        setCompletedLevels(done);
        const firstPendingIdx = planResult.levels.findIndex((l) => !done.includes(l.level));
        setLevelIdx(firstPendingIdx === -1 ? planResult.levels.length : firstPendingIdx);
        setPhase(firstPendingIdx === -1 ? 'done' : 'pre');
      } catch (err) {
        if (!cancelled) setLoadError(err.message);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participant, sessionNumber]);

  useEffect(() => {
    if (phase !== 'stimulus') return undefined;
    const level = plan?.levels[levelIdx];
    if (level?.stimulus?.contentType === 'simulation') {
      // Interactive simulations control their own pacing (the participant
      // clicks through them); there's no fixed minimum viewing timer.
      setSecondsLeft(0);
      return undefined;
    }
    setSecondsLeft(level?.durationSeconds || 30);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, levelIdx, plan]);

  if (!participant) {
    navigate('/participant-code');
    return null;
  }

  if (loadError) {
    return (
      <Layout>
        <div className="card">
          <p className="error-text">{loadError}</p>
        </div>
      </Layout>
    );
  }

  if (phase === 'loading' || !plan) {
    return (
      <Layout>
        <div className="card centered-message">Loading session…</div>
      </Layout>
    );
  }

  if (phase === 'done') {
    navigate(`/session/${sessionNumber}/summary`);
    return null;
  }

  const level = plan.levels[levelIdx];
  const totalLevels = plan.levels.length;

  function handleContinueFromPre() {
    setError('');
    if (sessionNumber > 1 && !reflectionText.trim()) {
      setError('Please answer the question below before continuing.');
      return;
    }
    setPhase('stimulus');
  }

  function handleSubmitQuestions() {
    setError('');
    if (!expectedText.trim() || !actualText.trim()) {
      setError('Please answer both questions below before continuing.');
      return;
    }
    submitLevel();
  }

  async function submitLevel() {
    setBusy(true);
    setError('');
    try {
      await api.submitExposureResponse(participant.studyCode, {
        sessionNumber,
        exposureLevel: level.level,
        stimulusId: level.stimulus?.id || null,
        preRating,
        // The separate "during" rating question was removed from the UI
        // (asking it right after "how do you feel now" felt redundant), but
        // the database still stores a during_rating value, so we mirror the
        // post-exposure rating into it.
        duringRating: postRating,
        postRating,
        expectedText,
        actualText,
        reflectionText,
        recordingUrl,
      });
      const nextIdx = levelIdx + 1;
      if (nextIdx >= totalLevels) {
        await api.completeSession(participant.studyCode, sessionNumber);
        navigate(`/session/${sessionNumber}/summary`);
        return;
      }
      setLevelIdx(nextIdx);
      setPreRating(5);
      setPostRating(5);
      setExpectedText('');
      setActualText('');
      setReflectionText('');
      setRecordingUrl(null);
      setPhase('pre');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>
      <div className="card">
        <h1 className="screen-title">
          Session {sessionNumber}, Level {level.level} of 5
        </h1>
        <p className="lead">
          Category: {categoryName} &middot; Step {levelIdx + 1} of {totalLevels} this session
        </p>

        {phase === 'pre' && (
          <>
            {sessionNumber > 1 ? (
              <>
                <Slider
                  question={`How have things been since your last session relating to ${topic}?`}
                  value={preRating}
                  onChange={setPreRating}
                  minLabel="Much worse"
                  maxLabel="Much better"
                />
                <div className="field-block">
                  <label className="field-label" htmlFor="reflection-text">
                    Did anything happen related to this fear since your last session? How did you deal with it?
                  </label>
                  <textarea
                    id="reflection-text"
                    value={reflectionText}
                    onChange={(e) => setReflectionText(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <Slider
                question={`How anxious do you feel right now about ${topic}?`}
                value={preRating}
                onChange={setPreRating}
                minLabel="Not anxious"
                maxLabel="Extremely anxious"
              />
            )}
            {error && <p className="error-text">{error}</p>}
            <div className="btn-row">
              <button className="btn btn-primary" onClick={handleContinueFromPre}>
                Continue
              </button>
            </div>
          </>
        )}

        {phase === 'stimulus' && (
          <>
            <div className="stimulus-frame">
              <StimulusDisplay
                stimulus={level.stimulus}
                studyCode={participant.studyCode}
                onSimulationComplete={(extra) => {
                  if (extra?.recordingUrl) setRecordingUrl(extra.recordingUrl);
                  setPhase('questions');
                }}
              />
            </div>
            {level.stimulus?.contentType === 'simulation' ? (
              <p className="stimulus-placeholder-text" style={{ textAlign: 'center', marginTop: 12 }}>
                Click through the scenario above to continue.
              </p>
            ) : (
              <>
                <div className="timer-ring">{secondsLeft > 0 ? `${secondsLeft}s remaining` : 'You may continue'}</div>
                <div className="btn-row">
                  <button className="btn btn-primary" disabled={secondsLeft > 0} onClick={() => setPhase('questions')}>
                    Continue
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {phase === 'questions' && (
          <>
            <Slider
              question={`How anxious do you feel right now about ${topic}?`}
              value={postRating}
              onChange={setPostRating}
              minLabel="Not anxious"
              maxLabel="Extremely anxious"
            />
            <div className="field-block">
              <label className="field-label" htmlFor="expected">
                How did you feel before the exposure?
              </label>
              <textarea id="expected" value={expectedText} onChange={(e) => setExpectedText(e.target.value)} />
            </div>
            <div className="field-block">
              <label className="field-label" htmlFor="actual">
                How did you feel during the exposure? How did this differ from what you expected?
              </label>
              <textarea id="actual" value={actualText} onChange={(e) => setActualText(e.target.value)} />
            </div>
            {error && <p className="error-text">{error}</p>}
            <div className="btn-row">
              <button className="btn btn-primary" disabled={busy} onClick={handleSubmitQuestions}>
                {levelIdx + 1 >= totalLevels ? 'Finish Session' : 'Next Level'}
              </button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
