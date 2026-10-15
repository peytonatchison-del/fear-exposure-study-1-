import React, { useEffect, useState } from 'react';
import useCountdown from '../hooks/useCountdown.js';

// A fictional group text thread used as an exposure stimulus for College
// Admissions Session 4 — the participant tells their friends they didn't
// get in, and the conversation moves toward their backup plan. Same
// animated-reveal + typed-reply structure as TextThreadSim.jsx (Session 2),
// just with a different scripted conversation. Nothing here references a
// real person.
const MESSAGES = [
  { from: 'You', text: 'Guys...' },
  { from: 'Sarah', text: 'Yeah? What\'s up?' },
  { from: 'You', text: 'I didn\'t get in...' },
  { from: 'Danny', text: 'Ughh, that really sucks I\'m sorry.' },
  { from: 'Sarah', text: 'Aw, that\'s so disappointing I\'m so sorry.' },
  { from: 'You', text: 'Yeah... but at least I won\'t have to move so far away.' },
  { from: 'Sarah', text: 'Yeah that\'s good, do you have a backup plan?' },
  { from: 'You', text: 'Yeah, I think I\'m gonna go to a different school for my first two years and see if I can transfer after that.' },
  { from: 'Danny', text: 'A college in town?' },
  { from: 'You', text: 'Yeah.' },
  { from: 'Sarah', text: 'Well on the bright side, we will get to see each other more often!' },
  { from: 'You', text: 'That\'s a good way to look at it.' },
  { from: 'Danny', text: 'Well, I got to get going, but I hope you get it figured out!' },
];

export default function CollegeFriendGroupChatRejectionSim({ onComplete }) {
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
