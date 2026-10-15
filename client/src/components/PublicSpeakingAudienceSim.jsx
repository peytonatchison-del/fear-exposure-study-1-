import React from 'react';
import AudienceReadAloud from './AudienceReadAloud.jsx';

// Session 2 (Level 2) for the Public Speaking category. A small simulated
// classroom audience — or, if the researcher has uploaded one from the
// Stimuli tab, their own classroom/audience video — and a short, simple
// preset passage the participant reads aloud. See AudienceReadAloud.jsx for
// the shared timer/audience mechanics.
const PASSAGE =
  'Good morning, everyone. Today I want to talk about my favorite season, which is fall. I like fall because the ' +
  'weather gets cooler and more comfortable. The leaves on the trees change color and turn red, orange, and yellow, ' +
  'which I think looks really nice. Fall is also when a lot of my favorite holidays happen, like Halloween and ' +
  'Thanksgiving. I like Halloween because I get to dress up and hang out with my friends. I like Thanksgiving ' +
  'because my whole family gets together and we eat a big meal. Overall, fall is my favorite time of year, and I ' +
  'look forward to it every year. Thank you for listening.';

export default function PublicSpeakingAudienceSim({ stimulus, onComplete }) {
  return (
    <AudienceReadAloud
      audienceCount={6}
      audienceVideoUrl={stimulus?.audienceVideoUrl || null}
      audienceVideoCredit={stimulus?.audienceVideoCredit || null}
      passageTitle="Read This Passage Aloud: “My Favorite Season”"
      passageText={PASSAGE}
      initialSeconds={45}
      onComplete={onComplete}
    />
  );
}
