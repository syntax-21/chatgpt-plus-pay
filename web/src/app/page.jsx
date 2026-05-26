import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  RefreshCw,
  Globe,
  Server,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
} from "lucide-react";
import { Toaster, toast } from "sonner";

export default function ChatGPTCheckoutPage() {
  const [token, setToken] = useState("");
  const [mode, setMode] = useState("Hosted (Stripe Page)");
  const [proxy, setProxy] = useState("");
  const [resultLink, setResultLink] = useState(null);
  const queryClient = useQueryClient();

  // Fetch Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["checkout-stats"],
    queryFn: async () => {
      const response = await fetch("/api/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Generate Checkout Mutation
  const generateMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate checkout link");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setResultLink(data.link);
      toast.success("Checkout link generated!");
      queryClient.invalidateQueries({ queryKey: ["checkout-stats"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleGenerate = () => {
    if (!token.trim()) {
      toast.error("Please enter a bearer token or session response");
      return;
    }
    generateMutation.mutate({ token, mode, proxy });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    return `${diffInHours} hours ago`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans p-4 md:p-8">
      <Toaster position="top-right" theme="dark" />

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#10b981] rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Bot className="w-8 h-8 text-black" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                Ghalz ChatGPT Checkout
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Generate Stripe payment link from ChatGPT API
              </p>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-4 flex gap-8 items-center shadow-xl">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Generated
              </span>
              <span className="text-xl font-bold text-[#10b981]">
                {statsLoading ? "..." : stats?.total || 0}
              </span>
            </div>
            <div className="w-px h-10 bg-gray-800" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Last Generated
              </span>
              <span className="text-sm font-medium text-gray-300">
                {statsLoading ? "..." : formatTimeAgo(stats?.last_generated)}
              </span>
            </div>
          </div>
        </div>

        {/* Main Generator Card */}
        <div className="bg-[#141414] border border-gray-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#10b981] opacity-5 blur-[100px] pointer-events-none" />

          <div className="space-y-6">
            {/* Bearer Token Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Bearer Token or JSON session response
                </label>
                <a
                  href="https://chatgpt.com/api/auth/session"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#10b981] hover:text-[#0ea371] hover:underline transition-colors flex items-center gap-1"
                >
                  Get Token →
                </a>
              </div>
              <textarea
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your ChatGPT bearer token or complete session response here..."
                className="w-full h-32 bg-[#0d0d0d] border border-gray-800 rounded-xl p-4 text-sm text-gray-300 focus:outline-none focus:border-[#10b981] transition-all resize-none font-mono"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mode Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                  <Server className="w-3 h-3" /> Mode
                </label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-gray-800 rounded-xl p-3 text-sm text-gray-300 focus:outline-none focus:border-[#10b981] appearance-none"
                >
                  <option>Hosted (Stripe Page)</option>
                  <option>Embedded (Checkout Session)</option>
                  <option>Direct API</option>
                </select>
              </div>

              {/* Proxy Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                  <Globe className="w-3 h-3" /> Proxy (Optional)
                </label>
                <input
                  type="text"
                  value={proxy}
                  onChange={(e) => setProxy(e.target.value)}
                  placeholder="http://user:pass@host:port"
                  className="w-full bg-[#0d0d0d] border border-gray-800 rounded-xl p-3 text-sm text-gray-300 focus:outline-none focus:border-[#10b981]"
                />
                <p className="text-[10px] text-gray-600 mt-1 italic">
                  Residential proxies are recommended for Japanese VPN proxy
                  requests.
                </p>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                generateMutation.isPending
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                  : "bg-[#10b981] text-black hover:bg-[#0ea371] active:scale-[0.98] shadow-[0_4px_15px_rgba(16,185,129,0.3)]"
              }`}
            >
              {generateMutation.isPending ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Generate Checkout
                  <RefreshCw className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Result Section */}
            {resultLink && (
              <div className="mt-8 p-6 bg-[#0d0d0d] border border-green-900/30 rounded-2xl space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                {/* Header Row */}
                <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                  <div className="flex items-center gap-2 text-[#10b981]">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-bold text-base">
                      Checkout Created
                    </span>
                  </div>
                  <a
                    href="https://chatgpt.com/api/auth/session"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#10b981] hover:text-[#0ea371] hover:underline flex items-center gap-1 transition-colors"
                  >
                    Get Token →
                  </a>
                </div>

                {/* Stripe Checkout URL Section */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                    Stripe Checkout URL
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                    <div className="flex-1 p-3 bg-[#050505] rounded-xl border border-gray-800 break-all font-mono text-xs text-gray-400 select-all flex items-center">
                      {resultLink}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(resultLink)}
                        className="p-3 bg-[#1a1a1a] hover:bg-gray-800 rounded-xl text-gray-300 border border-gray-800 transition-colors flex items-center justify-center gap-2 text-xs font-semibold px-4 flex-1 sm:flex-none"
                        title="Copy link"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </button>
                      <a
                        href={resultLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-[#10b981] hover:bg-[#0ea371] rounded-xl text-black transition-colors flex items-center justify-center gap-2 text-xs font-bold px-4 flex-1 sm:flex-none"
                        title="Open link"
                      >
                        <span>Open Checkout →</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Promo Applied Section */}
                <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                  <span className="text-sm font-medium text-gray-200">
                    Promo Applied: <span className="text-[#10b981] font-bold">ChatGPT Plus - 1 Month Free Trial (100% off)</span>
                  </span>
                </div>

                {/* Payment Summary Section */}
                <div className="bg-[#050505] border border-gray-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Payment Summary
                    </span>
                    <span className="text-xs font-bold text-black bg-[#10b981] px-2 py-0.5 rounded uppercase">
                      FREE
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="text-gray-200 font-mono">Rp 349.000</span>
                  </div>
                  <div className="flex justify-between text-sm text-[#10b981]">
                    <span>Discount</span>
                    <span className="font-mono">-Rp 349.000</span>
                  </div>
                  <div className="h-px bg-gray-800 my-1" />
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-sm font-bold text-white">Total Due Today</span>
                    <span className="text-lg font-bold text-[#10b981] font-mono">FREE</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer/Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#141414] border border-gray-800 rounded-2xl p-5 space-y-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="font-bold text-sm">VPN Proxy Support</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Fully compatible with Japanese VPN proxies to ensure regional
              bypass and seamless checkout generation.
            </p>
          </div>
          <div className="bg-[#141414] border border-gray-800 rounded-2xl p-5 space-y-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="font-bold text-sm">Auto-Refresh</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Checkout stats and status updates refresh automatically in
              real-time.
            </p>
          </div>
          <div className="bg-[#141414] border border-gray-800 rounded-2xl p-5 space-y-3">
            <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="font-bold text-sm">Secure Generation</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              All tokens are processed securely and never stored on our servers
              after the request is complete.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
