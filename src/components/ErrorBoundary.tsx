import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public props: Props;
  public state: State = {
    hasError: false,
    error: null,
  };

  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('HAPINOZ Application Error:', error, errorInfo);
  }

  private handleResetCache = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const keysToRemove = [
          'hapinoz_spices_products_v3',
          'hapinoz_spices_products_v2',
          'hapinoz_spices_products_v1',
          'hapinoz_spices_cart_v2',
          'hapinoz_spices_user_v2',
          'hapinoz_spices_users_v2',
          'hapinoz_spices_orders_v2',
          'hapinoz_spices_coupons_v2',
          'hapinoz_spices_addresses_v2',
        ];
        keysToRemove.forEach((k) => window.localStorage.removeItem(k));
      }
    } catch (e) {
      console.warn('Could not clear storage:', e);
    }
    window.location.reload();
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 text-stone-900 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-stone-200 text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-200 text-[#FF6A00]">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold font-serif text-slate-900">
                Notice loading HAPINOZ store
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                The application encountered an unexpected issue while loading data. You can refresh the view or reset local cache to load fresh product records.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-stone-100 rounded-xl text-xs font-mono text-stone-700 text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#FF6A00] text-white font-semibold text-sm hover:bg-[#E55F00] transition-colors shadow-sm cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reload App
              </button>
              <button
                onClick={this.handleResetCache}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-stone-100 text-stone-700 font-semibold text-sm hover:bg-stone-200 transition-colors border border-stone-200 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
