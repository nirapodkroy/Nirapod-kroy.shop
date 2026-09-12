import React, { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State;
  public props: Props;

  public constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  public handleReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-950 text-white font-sans">
          <div className="max-w-md w-full p-8 rounded-3xl bg-zinc-900 border border-zinc-800 text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-2xl">
              ⚠️
            </div>
            <h2 className="text-xl font-bold font-display text-white">
              লোড করতে সাময়িক সমস্যা হয়েছে
            </h2>
            <p className="text-xs text-zinc-400">
              অ্যাপ্লিকেশনটি রিলোড করতে নিচের বাটনে চাপ দিন। আপনার ব্রাউজার ক্যাশ ও সেশন স্বয়ংক্রিয়ভাবে রিসেট হয়ে যাবে।
            </p>
            {this.state.error && (
              <pre className="p-3 bg-zinc-950 rounded-xl text-[10px] text-zinc-500 overflow-x-auto text-left max-h-24">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReload}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-md active:scale-95 cursor-pointer"
            >
              পুনরায় রিলোড করুন (Reload Page)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
