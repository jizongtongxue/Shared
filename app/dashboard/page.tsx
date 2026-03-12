'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Crop {
  id: number
  name: string
  status: string
}

interface Reminder {
  id: number
  content: string
  isDone: boolean
}

export default function Dashboard() {
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [crops, setCrops] = useState<Crop[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null)
  const [newCrop, setNewCrop] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const uid = localStorage.getItem('userId')
    const uname = localStorage.getItem('userName')
    if (!uid) {
      router.push('/login')
      return
    }
    setUserId(uid)
    setUserName(uname)
    fetchData(uid)
  }, [])

  const fetchData = async (uid: string) => {
    // Fetch Crops
    fetch(`/api/crops?userId=${uid}`).then(r => r.json()).then(setCrops)
    // Fetch Reminders
    fetch(`/api/reminders?userId=${uid}`).then(r => r.json()).then(setReminders)
    // Fetch Last CheckIn
    fetch(`/api/checkin?userId=${uid}`).then(r => r.json()).then(data => {
      if (data && data.createdAt) setLastCheckIn(data.createdAt)
    })
  }

  const handleAddCrop = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCrop || !userId) return
    const res = await fetch('/api/crops', {
      method: 'POST',
      body: JSON.stringify({ name: newCrop, userId })
    })
    if (res.ok) {
      setNewCrop('')
      fetchData(userId)
    }
  }

  const handleCheckIn = async () => {
    if (!userId) return
    const res = await fetch('/api/checkin', {
      method: 'POST',
      body: JSON.stringify({ userId })
    })
    if (res.ok) {
      const data = await res.json()
      setLastCheckIn(data.createdAt)
      // Trigger AI analysis automatically on check-in
      triggerAI()
    }
  }

  const triggerAI = async () => {
    if (!userId) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/deepseek', {
        method: 'POST',
        body: JSON.stringify({ userId })
      })
      if (res.ok) {
        fetchData(userId)
      }
    } finally {
      setAiLoading(false)
    }
  }

  const toggleReminder = async (id: number, current: boolean) => {
    await fetch('/api/reminders', {
      method: 'PUT',
      body: JSON.stringify({ id, isDone: !current })
    })
    if (userId) fetchData(userId)
  }

  const deleteCrop = async (id: number) => {
    await fetch('/api/crops', {
      method: 'DELETE',
      body: JSON.stringify({ id })
    })
    if (userId) fetchData(userId)
  }

  if (!userId) return null

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">你好, {userName}</h1>
          <p className="text-gray-500">管理你的私人菜地</p>
        </div>
        <div className="text-right">
          <button
            onClick={handleCheckIn}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg transition transform hover:scale-105 flex items-center gap-2"
          >
            💧 浇水打卡
          </button>
          {lastCheckIn && (
            <p className="text-xs text-gray-400 mt-2">上次打卡: {new Date(lastCheckIn).toLocaleString()}</p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Crops Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
          <h2 className="text-xl font-semibold mb-4 text-green-800">我的作物</h2>
          <ul className="space-y-3 mb-4">
            {crops.map(crop => (
              <li key={crop.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium text-green-900">{crop.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-white px-2 py-1 rounded border text-green-600">{crop.status}</span>
                  <button onClick={() => deleteCrop(crop.id)} className="text-red-400 hover:text-red-600">×</button>
                </div>
              </li>
            ))}
            {crops.length === 0 && <p className="text-gray-400 text-center py-4">还没有作物，快种点什么吧</p>}
          </ul>
          <form onSubmit={handleAddCrop} className="flex gap-2">
            <input
              type="text"
              value={newCrop}
              onChange={(e) => setNewCrop(e.target.value)}
              placeholder="新作物名称 (如: 番茄)"
              className="flex-1 rounded-md border-gray-300 border p-2 text-sm"
            />
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700">
              种植
            </button>
          </form>
        </div>

        {/* Reminders Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-orange-800">待办提醒</h2>
            <div className="flex flex-col items-end">
              <button 
                onClick={triggerAI} 
                disabled={aiLoading}
                className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 disabled:opacity-50"
              >
                {aiLoading ? 'AI分析中...' : '立即分析'}
              </button>
              <span className="text-[10px] text-gray-400 mt-1">每天08:00自动更新</span>
            </div>
          </div>
          <ul className="space-y-3">
            {reminders.map(reminder => (
              <li key={reminder.id} className={`flex items-start gap-3 p-3 rounded-lg border ${reminder.isDone ? 'bg-gray-50 border-gray-100' : 'bg-orange-50 border-orange-100'}`}>
                <input
                  type="checkbox"
                  checked={reminder.isDone}
                  onChange={() => toggleReminder(reminder.id, reminder.isDone)}
                  className="mt-1 h-4 w-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                />
                <span className={`text-sm ${reminder.isDone ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                  {reminder.content}
                </span>
              </li>
            ))}
            {reminders.length === 0 && <p className="text-gray-400 text-center py-4">暂无待办事项</p>}
          </ul>
        </div>
      </div>
    </div>
  )
}
