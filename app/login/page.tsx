'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          code, 
          action: isRegister ? 'register' : 'login' 
        }),
      })

      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('userId', data.user.id.toString())
        localStorage.setItem('userName', data.user.name)
        localStorage.setItem('gardenId', data.user.gardenId.toString())
        router.push('/dashboard')
      } else {
        setError(data.error || (isRegister ? '注册失败' : '登录失败'))
      }
    } catch {
      setError('发生错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-green-800">
          {isRegister ? '新老乡注册 🚜' : '老乡请登录 🌾'}
        </h1>

        {/* Tab Switcher */}
        <div className="flex mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setIsRegister(false)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              !isRegister ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            登录
          </button>
          <button
            onClick={() => setIsRegister(true)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              isRegister ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            注册
          </button>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">名字</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2 text-gray-900"
              required
              placeholder="请输入您的名字"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">邀请码</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="请输入菜园邀请码"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2 text-gray-900"
              required
            />
            {isRegister && (
              <p className="text-xs text-gray-500 mt-1">注意: 只有已创建的菜园邀请码才能注册新用户</p>
            )}
          </div>

          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50"
          >
            {loading ? '处理中...' : (isRegister ? '立即注册' : '进村')}
          </button>
        </form>
        
        <div className="mt-6 text-center border-t pt-4">
          <button 
            onClick={() => router.push('/')}
            className="text-sm text-gray-500 hover:text-green-600 flex items-center justify-center gap-1 mx-auto transition-colors"
          >
            我是游客，只看看动态 &rarr;
          </button>
        </div>
      </div>
    </div>
  )
}
