"use client";

import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class NavigationErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Navigation Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col space-y-2 p-2">
          <div className="text-sm text-red-500">Navigation temporarily unavailable</div>
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
        </div>
      );
    }

    return this.props.children;
  }
}

export default NavigationErrorBoundary;
