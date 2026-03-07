'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  retry = () => this.setState({ hasError: false, error: undefined })

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-8">
          <div className="bg-rose-950/30 border border-rose-500/20 rounded-2xl p-6 text-center max-w-sm">
            <AlertCircle size={32} className="text-rose-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-white mb-1">Something went wrong</p>
            <p className="text-xs text-slate-400 mb-4">
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
            <button
              onClick={this.retry}
              className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
