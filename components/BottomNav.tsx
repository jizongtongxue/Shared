'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Home, Sprout, LogIn, LogOut } from 'lucide-react'

export default function BottomNav() {
  const [userId, setUserId] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = () => {
      setUserId(localStorage.getItem('userId'))
    }
    checkAuth()
    window.addEventListener('storage', checkAuth)
    return () => window.removeEventListener('storage', checkAuth)
  }, [pathname])

  if (pathname === '/login') return null

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe">
      <div className="flex justify-around items-center h-16">
        <Link 
          href="/" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname === '/' ? 'text-green-600' : 'text-gray-500'}`}
        >
          <Home size={24} />
          <span className="text-xs">动态</span>
        </Link>
        
        {userId ? (
          <Link 
            href="/dashboard" 
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname === '/dashboard' ? 'text-green-600' : 'text-gray-500'}`}
          >
            <Sprout size={24} />
            <span className="text-xs">菜地</span>
          </Link>
        ) : (
          <Link 
            href="/login" 
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname === '/login' ? 'text-green-600' : 'text-gray-500'}`}
          >
            <LogIn size={24} />
            <span className="text-xs">认证</span>
          </Link>
        )}

        {userId && (
           <button 
             onClick={() => {
               localStorage.removeItem('userId')
               localStorage.removeItem('userName')
               window.location.href = '/'
             }}
             className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-500"
           >
             <LogOut size={24} />
             <span className="text-xs">退出</span>
           </button>
        )}
      </div>
    </div>
  )
}
