'use client'

import { useState } from 'react'

export function MobileMenuToggle() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => {
    setIsOpen(!isOpen)
    const menu = document.getElementById('mobile-menu')
    menu?.classList.toggle('hidden')
  }

  return (
    <button
      className="text-white hover:text-[#FFB22C] transition-colors"
      onClick={toggleMenu}
      aria-label="Toggle mobile menu"
      aria-expanded={isOpen}
    >
      <div className="w-6 h-6 flex flex-col justify-center space-y-1">
        <div className="w-6 h-0.5 bg-white"></div>
        <div className="w-6 h-0.5 bg-white"></div>
        <div className="w-6 h-0.5 bg-white"></div>
      </div>
    </button>
  )
}
