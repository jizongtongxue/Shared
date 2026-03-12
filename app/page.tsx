'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Post {
  id: number
  content: string
  imageUrl?: string
  videoUrl?: string
  createdAt: string
  user: {
    name: string
  }
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  
  // New Post Form
  const [content, setContent] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  
  // Image Preview Modal
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    setUserId(localStorage.getItem('userId'))
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/posts')
      if (res.ok) {
        const data = await res.json()
        setPosts(data)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    
    setSubmitting(true)
    try {
      let imageUrl: string | undefined = undefined
      let videoUrl: string | undefined = undefined

      if (selectedFile) {
        const formData = new FormData()
        formData.append('file', selectedFile)
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          if (selectedFile.type.startsWith('image/')) {
            imageUrl = uploadData.url
          } else if (selectedFile.type.startsWith('video/')) {
            videoUrl = uploadData.url
          }
        } else {
          throw new Error('Upload failed')
        }
      }

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, imageUrl, videoUrl, userId }),
      })
      
      if (res.ok) {
        setContent('')
        setSelectedFile(null)
        const fileInput = document.getElementById('fileInput') as HTMLInputElement
        if (fileInput) fileInput.value = ''
        fetchPosts()
      }
    } catch (error) {
      console.error('Error creating post:', error)
      alert('发布失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-extrabold text-green-800 tracking-tight">村口动态墙</h1>
        <p className="mt-2 text-lg text-green-600">看看大家都在种什么</p>
      </div>

      {/* Create Post (Only if logged in) */}
      {userId && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-stone-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">发布新动态</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="分享今天的农活..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-3"
              rows={3}
              required
            />
            <input
              id="fileInput"
              type="file"
              accept="image/*,video/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0])
                }
              }}
              className="w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-green-50 file:text-green-700
                hover:file:bg-green-100"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? '发布中...' : '发布'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Feed */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-center col-span-full text-gray-500">加载中...</p>
        ) : posts.length === 0 ? (
          <p className="text-center col-span-full text-gray-500">还没有动态，快来发一条吧！</p>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 border border-stone-100">
              {post.videoUrl ? (
                <div className="w-full bg-black">
                  <video controls className="w-full h-auto max-h-[500px]">
                    <source src={post.videoUrl} />
                    Your browser does not support the video tag.
                  </video>
                </div>
              ) : post.imageUrl && (
                <div className="w-full bg-stone-100 cursor-pointer overflow-hidden" onClick={() => setPreviewImage(post.imageUrl!)}>
                  <img
                    src={post.imageUrl}
                    alt="Post image"
                    className="w-full h-auto max-h-[500px] object-contain mx-auto"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image'
                    }}
                  />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-gray-900">{post.user.name}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700 leading-relaxed">{post.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black z-[100] flex items-center justify-center p-0"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <img 
              src={previewImage} 
              alt="Full size preview" 
              className="max-w-full max-h-full object-contain"
            />
            {/* Close button for mobile accessibility */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setPreviewImage(null);
              }}
              className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 backdrop-blur-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
