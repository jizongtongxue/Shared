'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDateTime } from '@/lib/datetime'

interface Crop {
  id: number
  name: string
  status: string
  user: {
    name: string
  }
}

interface Reminder {
  id: number
  content: string
  isDone: boolean
}

interface CheckIn {
  id: number
  createdAt: string
  user: {
    name: string
  }
}

export default function Dashboard() {
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [crops, setCrops] = useState<Crop[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [lastCheckIn, setLastCheckIn] = useState<CheckIn | null>(null)
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
    fetchData()
  }, [router])

  const fetchData = async () => {
    const gid = localStorage.getItem('gardenId')
    if (!gid) return

    // Fetch Crops (Garden Specific)
    fetch(`/api/crops?gardenId=${gid}`).then(r => r.json()).then(setCrops)
    // Fetch Reminders (Garden Specific)
    fetch(`/api/reminders?gardenId=${gid}`).then(r => r.json()).then(setReminders)
    // Fetch Last CheckIn (Garden Specific)
    fetch(`/api/checkin?gardenId=${gid}`).then(r => r.json()).then(setLastCheckIn)
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
      fetchData()
    }
  }

  const handleCheckIn = async () => {
    if (!userId) return
    const res = await fetch('/api/checkin', {
      method: 'POST',
      body: JSON.stringify({ userId })
    })
    if (res.ok) {
      fetchData()
      // Trigger AI analysis automatically on check-in
      triggerAI()
    }
  }

  const triggerAI = async () => {
    setAiLoading(true)
    try {
      const res = await fetch('/api/deepseek', {
        method: 'POST'
      })
      if (res.ok) {
        fetchData()
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
    fetchData()
  }

  const deleteCrop = async (id: number) => {
    await fetch('/api/crops', {
      method: 'DELETE',
      body: JSON.stringify({ id })
    })
    fetchData()
  }

  if (!userId) return null

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">你好, {userName}</h1>
          <p className="text-gray-500">管理村里的共享菜园</p>
        </div>
        <div className="text-right">
          <button
            onClick={handleCheckIn}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg transition transform hover:scale-105 flex items-center gap-2"
          >
            💧 浇水打卡
          </button>
          {lastCheckIn && (
            <div className="mt-2">
              <p className="text-xs text-gray-400">上次打卡: {formatDateTime(lastCheckIn.createdAt)}</p>
              <p className="text-[10px] text-blue-400">打卡人: {lastCheckIn.user.name}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Crops Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
          <h2 className="text-xl font-semibold mb-4 text-green-800">共享作物</h2>
          <ul className="space-y-3 mb-4">
            {crops.map(crop => (
              <li key={crop.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div className="flex flex-col">
                  <span className="font-medium text-green-900">{crop.name}</span>
                  <span className="text-[10px] text-green-600/60">种植者: {crop.user.name}</span>
                </div>
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
