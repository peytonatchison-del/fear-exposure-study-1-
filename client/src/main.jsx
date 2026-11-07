import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { StudyProvider } from './context/StudyContext.jsx';
import './styles/index.css';
import './styles/researcher.css';

// Belt-and-suspenders for the "silent blank white screen" failure mode:
// <ErrorBoundary> below only catches errors thrown while React is rendering
// component output. It cannot catch an error thrown in an event handler
// (e.g. an onClick), an unhandled promise rejection, or anything that goes
// wrong before React even gets to mount (a module failing to evaluate). Any
// of those leave the page blank with nothing in the console explaining why,
// which is exactly what made this bug so hard to track down. These two
// listeners catch every one of those cases, log the real error loudly to
// the console, and show a visible banner instead of leaving a silent blank
// page — so a problem is always visible, and if it recurs, the console will
// finally show what actually broke.
function showFatalErrorBanner(label, detail) {
  // eslint-disable-next-line no-console
  console.error('[fatal] ' + label, detail);
  if (document.getElementById('fatal-error-banner')) return; // only show once
  const banner = document.createElement('div');
  banner.id = 'fatal-error-banner';
  banner.setAttribute('role', 'alert');
  banner.style.cssText =
    'position:fixed;top:0;left:0;right:0;z-index:999999;background:#a3233b;color:#fff;' +
    'padding:14px 20px;font:14px/1.4 Arial,Helvetica,sans-serif;text-align:center;';
  banner.textContent =
    'Something went wrong loading this page. Please reload the page (or close this tab and open your study link again).';
  document.body.prepend(banner);
}

window.addEventListener('error', (event) => {
  showFatalErrorBanner('window error', (event.error && event.error.stack) || event.message);
});
window.addEventListener('unhandledrejection', (event) => {
  showFatalErrorBanner(
    'unhandled promise rejection',
    (event.reason && event.reason.stack) || event.reason
  );
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <StudyProvider>
          <App />
        </StudyProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
