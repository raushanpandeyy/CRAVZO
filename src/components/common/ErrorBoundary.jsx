import React from "react";
import { AlertTriangle } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Something went wrong</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-xs">
            We hit an unexpected error. Try refreshing the page or going back.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => window.history.back()}
              className="rounded-xl border-2 border-indigo-200 px-5 py-2.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition"
            >
              Go Back
            </button>
            <button
              onClick={this.handleRetry}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
