'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function Navbar() {
  const [userId, setUserId] = useState<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    setUserId(localStorage.getItem('userId'))
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('userId')
    localStorage.removeItem('userName')
    setUserId(null)
    router.push('/')
  }

  if (pathname === '/login') return null

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 hidden md:block">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex-shrink-0 flex items-center text-green-600 font-bold text-xl">
              🌱 共享菜园
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/" className={`px-3 py-2 rounded-md text-sm font-medium ${pathname === '/' ? 'text-green-700 bg-green-50' : 'text-gray-500 hover:text-gray-700'}`}>
              村口动态
            </Link>
            
            {userId ? (
              <>
                <Link href="/dashboard" className={`px-3 py-2 rounded-md text-sm font-medium ${pathname === '/dashboard' ? 'text-green-700 bg-green-50' : 'text-gray-500 hover:text-gray-700'}`}>
                  我的菜地
                </Link>
                <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700 ml-4">
                  退出
                </button>
              </>
            ) : (
              <Link href="/login" className="text-sm text-white bg-green-600 px-4 py-2 rounded-full hover:bg-green-700 transition">
                老乡认证
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
