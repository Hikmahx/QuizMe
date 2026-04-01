'use client';

import Image from 'next/image';

interface FeatureIconProps {
  icon: string;
  label?: string;
  bgClass: string;
  iconClass: string;
  containerSize?: number;
  iconSize?: number;
  labelSize?: string;
  labelWeight?: string;
  showLabel?: boolean;
}

/**
 * FeatureIcon renders the coloured icon box optionally followed by a text label.
 * Used in:
 *  - Feature.tsx (home page cards)
 *  - Breadcrumb.tsx (feature path indicator)
 */
export default function FeatureIcon({
  icon,
  label,
  bgClass,
  iconClass,
  containerSize = 40,
  iconSize = 20,
  labelSize = 'text-base',
  labelWeight = 'font-medium',
  showLabel = true,
}: FeatureIconProps) {
  return (
    <span className='flex items-center gap-2'>
      {/* Icon box */}
      <span
        className={`flex-shrink-0 rounded-xl flex items-center justify-center ${bgClass}`}
        style={{ width: containerSize, height: containerSize }}
      >
        <span
          className={`block bg-current ${iconClass}`}
          style={{
            width: iconSize,
            height: iconSize,
            maskImage: `url(${icon})`,
            WebkitMaskImage: `url(${icon})`,
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            maskSize: 'contain',
          }}
        />
      </span>

      {/* Optional label */}
      {showLabel && label && (
        <span className={`text-app-text ${labelSize} ${labelWeight}`}>
          {label}
        </span>
      )}
    </span>
  );
}
