import { MuscleGroup } from '../types';

interface MuscleHighlightSvgProps {
  primaryMuscle: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  className?: string;
}

export function MuscleHighlightSvg({ primaryMuscle, secondaryMuscles = [], className = "w-32 h-44" }: MuscleHighlightSvgProps) {
  const isPrimary = (muscle: MuscleGroup) => primaryMuscle === muscle;
  const isSecondary = (muscle: MuscleGroup) => secondaryMuscles.includes(muscle);

  const getColor = (muscle: MuscleGroup) => {
    if (isPrimary(muscle)) return '#10b981'; // vibrant neon athletic emerald
    if (isSecondary(muscle)) return '#059669'; // secondary darker emerald/cyan
    return '#272f38'; // neutral dark body silhouette
  };

  return (
    <div className={`relative flex items-center justify-center p-2 rounded-xl bg-[#11161d] border border-neutral-800/80 ${className}`}>
      <svg viewBox="0 0 160 220" className="w-full h-full max-h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Head */}
        <circle cx="80" cy="24" r="14" fill="#272f38" />
        <rect x="75" y="36" width="10" height="8" rx="3" fill="#272f38" />

        {/* Traps / Neck */}
        <path d="M68 44 L92 44 L102 54 L58 54 Z" fill={getColor('Costas')} />

        {/* Shoulders (Deltoids) */}
        <path d="M56 52 C50 54 44 62 48 72 C52 74 58 66 60 56 Z" fill={getColor('Ombros')} />
        <path d="M104 52 C110 54 116 62 112 72 C108 74 102 66 100 56 Z" fill={getColor('Ombros')} />

        {/* Chest (Pectorals) */}
        <path d="M60 56 C70 56 78 62 78 76 C66 78 58 72 58 64 Z" fill={getColor('Peito')} />
        <path d="M100 56 C90 56 82 62 82 76 C94 78 102 72 102 64 Z" fill={getColor('Peito')} />

        {/* Biceps & Forearms */}
        <path d="M47 73 C42 80 40 92 45 102 C49 100 51 90 51 77 Z" fill={getColor('Bíceps')} />
        <path d="M113 73 C118 80 120 92 115 102 C111 100 109 90 109 77 Z" fill={getColor('Bíceps')} />

        {/* Triceps (Back/Outer arm indicator) */}
        <path d="M42 74 C38 82 38 90 42 98 Z" fill={getColor('Tríceps')} />
        <path d="M118 74 C122 82 122 90 118 98 Z" fill={getColor('Tríceps')} />

        {/* Core / Abdominals */}
        <rect x="66" y="78" width="13" height="10" rx="2" fill={getColor('Abdômen')} />
        <rect x="81" y="78" width="13" height="10" rx="2" fill={getColor('Abdômen')} />
        <rect x="67" y="90" width="12" height="10" rx="2" fill={getColor('Abdômen')} />
        <rect x="81" y="90" width="12" height="10" rx="2" fill={getColor('Abdômen')} />
        <rect x="68" y="102" width="11" height="9" rx="2" fill={getColor('Abdômen')} />
        <rect x="81" y="102" width="11" height="9" rx="2" fill={getColor('Abdômen')} />

        {/* Glutes / Hip area */}
        <path d="M62 113 C62 124 76 130 78 130 C80 130 98 124 98 113 Z" fill={getColor('Glúteos')} />

        {/* Upper Legs (Quadriceps & Hamstrings) */}
        <path d="M62 128 C58 140 56 162 64 172 C72 172 76 156 76 130 Z" fill={getColor('Pernas')} />
        <path d="M98 128 C102 140 104 162 96 172 C88 172 84 156 84 130 Z" fill={getColor('Pernas')} />

        {/* Knees */}
        <circle cx="65" cy="174" r="5" fill="#272f38" />
        <circle cx="95" cy="174" r="5" fill="#272f38" />

        {/* Lower Legs (Calves / Panturrilhas) */}
        <path d="M61 178 C57 186 58 198 64 206 C68 206 70 196 69 178 Z" fill={getColor('Panturrilhas')} />
        <path d="M99 178 C103 186 102 198 96 206 C92 206 90 196 91 178 Z" fill={getColor('Panturrilhas')} />

        {/* Feet */}
        <ellipse cx="61" cy="209" rx="7" ry="4" fill="#272f38" />
        <ellipse cx="99" cy="209" rx="7" ry="4" fill="#272f38" />
      </svg>
      <div className="absolute bottom-1 right-2 text-[10px] font-mono text-neutral-400">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1 align-middle"></span>
        {primaryMuscle}
      </div>
    </div>
  );
}
