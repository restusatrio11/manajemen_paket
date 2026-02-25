import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface LoadingSpinnerProps {
  text?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ text = "Loading...", fullScreen = false }: LoadingSpinnerProps) {
  return (
    <div className={fullScreen ? 
      "fixed inset-0 z-[100] bg-slate-50/80 backdrop-blur-sm flex flex-col items-center justify-center transition-all duration-300" 
      : "h-[60vh] w-full flex flex-col items-center justify-center bg-transparent"
    }>
      <div className="w-48 h-48 -mb-8">
        <DotLottieReact
          src="https://lottie.host/3ec8fb09-c7d5-4cc1-8dff-47b66fcb0da5/hyLGRYTSVw.lottie"
          loop
          autoplay
        />
      </div>
      <p className="text-bps-blue font-semibold animate-pulse tracking-wide">
        {text}
      </p>
    </div>
  );
}
