'use client';

import Link from 'next/link';
import { BreadcrumbCrumb, FeatureMeta } from '@/types';
import FeatureIcon from './FeatureIcon';

interface BreadcrumbProps {
  feature: FeatureMeta;
  crumbs?: BreadcrumbCrumb[];
}

/**
 * Renders:  [icon] Feature Label  ›  Crumb 1  ›  Active Crumb
 *
 * The feature segment uses FeatureIcon (same component as Feature cards) at a
 * smaller scale. Intermediate crumbs are muted; the last crumb is white/active.
 */
export default function Breadcrumb({ feature, crumbs = [] }: BreadcrumbProps) {
  return (
    <nav
      aria-label='breadcrumb'
      className='flex items-center gap-2 px-6 md:px-12 pb-4 text-sm flex-wrap'
    >
      {/* Feature chip */}
      <FeatureIcon
        icon={feature.icon}
        label={feature.label}
        bgClass={feature.bgClass}
        iconClass={feature.iconClass}
        containerSize={28}
        iconSize={14}
        labelSize='text-sm'
        labelWeight='font-medium'
      />

      {/* Additional crumbs */}
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={i} className='flex items-center gap-2'>
            <span className='text-app-text-secondary'>›</span>
            {crumb.href && !isLast ? (
              <Link
                href={crumb.href}
                className='text-app-text-secondary italic hover:text-app-text transition-colors'
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                className={
                  isLast
                    ? 'text-app-text font-medium'
                    : 'text-app-text-secondary italic'
                }
              >
                {crumb.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
