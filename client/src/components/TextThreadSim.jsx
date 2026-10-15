import React, { useEffect, useState } from 'react';
import useCountdown from '../hooks/useCountdown.js';

// A fictional group text thread used as an exposure stimulus for
// "a friend I assumed was going to the same school changed plans" anxiety —
// College Admissions Session 2. Messages reveal one at a time (with a short
// typing-indicator pause) so it reads like a real conversation happening
// live, then the participant is invited to type their own reply in
// character before continuing. Nothing here references a real person.
const MESSAGES = [
  { from: 'Danny', text: 'Wassup!!!' },
  { from: 'Sarah', text: 'Hey Danny! Find out where you’re headed?' },
  { from: 'Danny', text: 'Yesss. I think I\'m gonna go to community college and become an electrician!!!' },
  { from: 'Sarah', text: 'NO WAYYY!!! That’s amazing! I\'m so happy for you!!!' },
  { from: 'You', text: 'Danny? I thought you were going to apply to UF?' },
  { from: 'Danny', text: 'I was, but it was too expensive for me rn.' },
  { from: 'You', text: 'Oh... okay. Still SUPER happy for you!' },
  { from: 'Sarah', text: 'Hey, did you get your decision back yet?' },
  { from: 'You', text: 'No, not yet. They come out in a week. Wish me luck!' },
  { from: 'Danny', text: 'YAY! I wish you the best!' },
  { from: 'Sarah', text: 'Me too!! Do y\'all wanna hang out soon?' },
  { from: 'Danny', text: 'Of course! Lunch at Chipotle Tuesday?' },
  { from: 'Sarah', text: 'Sounds good to me!' },
];

export default function TextThreadSim({ onComplete }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [typing, setTyping] = useState(false);
  const [reply, setReply] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (visibleCount >= MESSAGES.length) return undefined;
    setTyping(true);
    const revealTimer = setTimeout(() => {
      setTyping(false);
      setVisibleCount((c) => c + 1);
    }, 650);
    return () => clearTimeout(revealTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleCount]);

  const allShown = visibleCount >= MESSAGES.length;
  // Once the participant has sent their reply, make them sit with it for a
  // beat before they can move on — resets the moment `sent` flips to true.
  const secondsLeft = useCountdown(10, sent);
  const ready = secondsLeft <= 0;

  return (
    <div className="sim-portal" role="group" aria-label="Simulated group text thread">
      <div className="sim-portal-disclaimer">Simulated scenario for this study, not a real conversation</div>

      <div className="sim-chat-window">
        <div className="sim-chat-header">Group Chat &middot; Danny, Sarah</div>

        <div className="sim-chat-body">
          {MESSAGES.slice(0, visibleCount).map((m, i) => (
            <div key={i} className={`sim-chat-row ${m.from === 'You' ? 'me' : 'them'}`}>
              {m.from !== 'You' && <div className="sim-chat-sender">{m.from}</div>}
              <div className="sim-chat-bubble">{m.text}</div>
            </div>
          ))}
          {typing && (
            <div className="sim-chat-row them">
              <div className="sim-chat-bubble sim-chat-typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
          {allShown && sent && (
            <div className="sim-chat-row me">
              <div className="sim-chat-bubble">{reply.trim() || '(no reply typed)'}</div>
            </div>
          )}
        </div>

        {allShown && !sent && (
          <div className="sim-chat-composer">
            <input
              type="text"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder='Type your reply as "You"...'
              aria-label="Your reply"
            />
            <button type="button" className="btn btn-primary sim-chat-send-btn" onClick={() => setSent(true)}>
              Send
            </button>
          </div>
        )}

        {allShown && sent && (
          <div className="sim-chat-composer sim-chat-composer--continue">
            <p className="sim-portal-hint" style={{ margin: 0 }}>
              {ready ? 'You may continue.' : `You can continue in ${secondsLeft}s`}
            </p>
            <button
              type="button"
              className="btn btn-primary sim-chat-send-btn"
              disabled={!ready}
              onClick={onComplete}
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
