import React from 'react';

// Wraps the whole app (see main.jsx). Without something like this, any
// unexpected JavaScript error anywhere in the component tree unmounts the
// entire React app and leaves the participant staring at a blank white
// page — which is almost certainly what "it just shut down" was describing.
// This catches that instead and shows a plain message with a way to
// recover, rather than silently losing the whole page.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Unexpected error caught by ErrorBoundary:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="card centered-message" role="alert">
          <h1 className="screen-title">Something went wrong</h1>
          <p className="lead">
            Sorry about that, an unexpected error interrupted the page. Your answers up to the last screen you
            completed should already be saved. Reloading usually fixes this.
          </p>
          <div className="btn-row" style={{ justifyContent: 'center' }}>
            <button type="button" className="btn btn-primary" onClick={this.handleReload}>
              Reload the page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
