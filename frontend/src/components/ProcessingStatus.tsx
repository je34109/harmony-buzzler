"use client";

interface ProcessingStatusProps {
  currentStep: number; // 1-6
  error: string | null;
}

const STEPS = [
  { label: "下載音頻中...", estimate: "" },
  { label: "分離人聲中...", estimate: "（預計 3-5 分鐘）" },
  { label: "檢測調性和速度...", estimate: "" },
  { label: "檢測和弦...", estimate: "" },
  { label: "提取旋律...", estimate: "" },
  { label: "生成簡譜...", estimate: "" },
];

export default function ProcessingStatus({
  currentStep,
  error,
}: ProcessingStatusProps) {
  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {STEPS.map((step, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isDone = stepNum < currentStep;
        const isPending = stepNum > currentStep;

        return (
          <div
            key={stepNum}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
              isActive
                ? "bg-gray-800/80 ring-1 ring-pink-500/40"
                : isDone
                ? "bg-gray-800/40"
                : "bg-gray-900/30 opacity-50"
            }`}
          >
            {/* Status icon */}
            <div className="shrink-0 w-7 h-7 flex items-center justify-center">
              {isDone && (
                <svg
                  className="w-5 h-5 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
              {isActive && !error && (
                <div className="w-5 h-5 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
              )}
              {isActive && error && (
                <svg
                  className="w-5 h-5 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
              {isPending && (
                <div className="w-4 h-4 rounded-full border-2 border-gray-600" />
              )}
            </div>

            {/* Step text */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${
                  isActive
                    ? "text-white"
                    : isDone
                    ? "text-gray-400"
                    : "text-gray-500"
                }`}
              >
                {step.label}
                {isActive && step.estimate && (
                  <span className="text-gray-500 ml-1">{step.estimate}</span>
                )}
              </p>
            </div>

            {/* Step number */}
            <span
              className={`text-xs font-mono ${
                isActive
                  ? "text-pink-400"
                  : isDone
                  ? "text-green-400/60"
                  : "text-gray-600"
              }`}
            >
              {stepNum}/6
            </span>
          </div>
        );
      })}

      {/* Error display */}
      {error && (
        <div className="mt-4 p-4 rounded-lg bg-red-950/50 border border-red-800/50">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
