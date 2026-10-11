import React from 'react';

interface ScoreGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  showGrade?: boolean;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  size = 120,
  strokeWidth = 10,
  label,
  showGrade = true,
}) => {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  let color = '#ef4444'; // Red < 50
  let grade = 'Needs Work';
  if (normalizedScore >= 85) {
    color = '#10b981'; // Green
    grade = 'Excellent';
  } else if (normalizedScore >= 70) {
    color = '#3b82f6'; // Blue
    grade = 'Strong';
  } else if (normalizedScore >= 55) {
    color = '#f59e0b'; // Amber
    grade = 'Moderate';
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-extrabold text-white tracking-tight">{normalizedScore}</span>
          <span className="text-[10px] uppercase font-semibold text-slate-400">/ 100</span>
        </div>
      </div>
      {showGrade && (
        <span
          className="mt-2 text-xs font-semibold px-2.5 py-0.5 rounded-full border"
          style={{
            borderColor: `${color}40`,
            backgroundColor: `${color}15`,
            color: color,
          }}
        >
          {grade}
        </span>
      )}
      {label && <p className="mt-1 text-xs text-slate-400 font-medium">{label}</p>}
    </div>
  );
};
