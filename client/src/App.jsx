import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Welcome from './screens/Welcome.jsx';
import About from './screens/About.jsx';
import Consent from './screens/Consent.jsx';
import ParticipantCode from './screens/ParticipantCode.jsx';
import FearCategory from './screens/FearCategory.jsx';
import Baseline from './screens/Baseline.jsx';
import ExposureIntro from './screens/ExposureIntro.jsx';
import ExposureSession from './screens/ExposureSession.jsx';
import SessionSummary from './screens/SessionSummary.jsx';
import BetweenSessions from './screens/BetweenSessions.jsx';
import FinalAssessment from './screens/FinalAssessment.jsx';
import Complete from './screens/Complete.jsx';
import EmergencyHelp from './screens/EmergencyHelp.jsx';
import Withdrawn from './screens/Withdrawn.jsx';

import { ResearcherAuthProvider } from './researcher/ResearcherAuth.jsx';
import ResearcherLayout from './researcher/ResearcherLayout.jsx';
import ResearcherLogin from './researcher/Login.jsx';
import Overview from './researcher/Overview.jsx';
import Participants from './researcher/Participants.jsx';
import Protocol from './researcher/Protocol.jsx';
import Stimuli from './researcher/Stimuli.jsx';
import IrbChecklist from './researcher/IrbChecklist.jsx';
import Export from './researcher/Export.jsx';
import Account from './researcher/Account.jsx';

export default function App() {
  return (
    <Routes>
      {/* Participant-facing flow */}
      <Route path="/" element={<Welcome />} />
      <Route path="/about" element={<About />} />
      <Route path="/consent" element={<Consent />} />
      <Route path="/participant-code" element={<ParticipantCode />} />
      <Route path="/fear-category" element={<FearCategory />} />
      <Route path="/baseline" element={<Baseline />} />
      <Route path="/exposure-intro" element={<ExposureIntro />} />
      <Route path="/session/:sessionNumber" element={<ExposureSession />} />
      <Route path="/session/:sessionNumber/summary" element={<SessionSummary />} />
      <Route path="/between-sessions" element={<BetweenSessions />} />
      <Route path="/final-assessment" element={<FinalAssessment />} />
      <Route path="/complete" element={<Complete />} />
      <Route path="/help" element={<EmergencyHelp />} />
      <Route path="/withdrawn" element={<Withdrawn />} />

      {/* Researcher dashboard */}
      <Route
        path="/researcher/*"
        element={
          <ResearcherAuthProvider>
            <Routes>
              <Route path="login" element={<ResearcherLogin />} />
              <Route element={<ResearcherLayout />}>
                <Route path="overview" element={<Overview />} />
                <Route path="participants" element={<Participants />} />
                <Route path="protocol" element={<Protocol />} />
                <Route path="stimuli" element={<Stimuli />} />
                <Route path="irb" element={<IrbChecklist />} />
                <Route path="export" element={<Export />} />
                <Route path="account" element={<Account />} />
                <Route path="*" element={<Overview />} />
              </Route>
            </Routes>
          </ResearcherAuthProvider>
        }
      />
    </Routes>
  );
}
