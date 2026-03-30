'use client'

import Link from 'next/link'

interface CategoryProps {
  title: string
  path: string
  icon: string
  bgClass: string   // e.g. 'bg-purple-500/20'
  iconClass: string // e.g. 'text-purple-500'
}

export default function Category({ title, path, icon, bgClass, iconClass }: CategoryProps) {
  return (
    <div className="group w-full">
      <div className="flex items-center gap-4 md:gap-8 p-3 md:p-5 w-full bg-white dark:bg-[#3B4D66] rounded-xl md:rounded-3xl shadow-sm hover:ring-2 hover:ring-[#A729F5] transition-all duration-200 cursor-pointer">
        <div className="bg-white rounded-xl flex-shrink-0">
          <div className={`rounded-xl flex items-center justify-center w-10 h-10 md:w-14 md:h-14 ${bgClass} ${iconClass}`}>
            <div 
              className="w-6 h-6 md:w-8 md:h-8 bg-current"
              style={{
                maskImage: `url(${icon})`,
                WebkitMaskImage: `url(${icon})`,
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
                maskSize: 'contain'
              }}
            />
          </div>
        </div>

        <span className="text-lg md:text-2xl font-medium text-[#313E51] dark:text-white">
          {title}
        </span>
      </div>
    </div>
  )
}
