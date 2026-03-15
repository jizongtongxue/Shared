'use client'

import { useEffect, useState, useCallback } from 'react'

interface Post {
  id: number
  content: string
  imageUrls: string[]
  videoUrl?: string
  createdAt: string
  user: {
    name: string
  }
  garden: {
    name: string
    inviteCode: string
  }
}

interface Garden {
  id: number
  name: string
  inviteCode: string
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [gardens, setGardens] = useState<Garden[]>([])
  const [selectedGardenId, setSelectedGardenId] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  
  // New Post Form
  const [content, setContent] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  
  // Image Preview Modal
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const fetchGardens = useCallback(async () => {
    try {
      const res = await fetch('/api/gardens')
      if (res.ok) {
        const data = await res.json()
        setGardens(data)
      }
    } catch (error) {
      console.error('Error fetching gardens:', error)
    }
  }, [])

  const fetchPosts = useCallback(async (pageNum: number, isInitial: boolean = false, gardenIdOverride?: string) => {
    if (isInitial) setLoading(true)
    else setLoadingMore(true)

    const gid = gardenIdOverride || selectedGardenId

    try {
      const res = await fetch(`/api/posts?page=${pageNum}&gardenId=${gid}`)
      if (res.ok) {
        const data = await res.json()
        if (isInitial) {
          setPosts(data)
        } else {
          setPosts(prev => [...prev, ...data])
        }
        setHasMore(data.length === 20)
        setPage(pageNum)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [selectedGardenId])

  useEffect(() => {
    setUserId(localStorage.getItem('userId'))
    fetchGardens()
    fetchPosts(1, true)
  }, [fetchGardens, fetchPosts])

  const handleGardenChange = (gid: string) => {
    setSelectedGardenId(gid)
    fetchPosts(1, true, gid)
  }

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchPosts(page + 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    
    setSubmitting(true)
    try {
      const imageUrls: string[] = []
      let videoUrl: string | undefined = undefined

      if (selectedFiles.length > 0) {
        // Parallel uploads for better performance
        const uploadPromises = selectedFiles.map(async (file) => {
          let fileToUpload = file

          // Compress image if it's an image and larger than 1MB
          if (file.type.startsWith('image/') && file.size > 1024 * 1024) {
            try {
              const compressedFile = await compressImage(file)
              fileToUpload = compressedFile
            } catch (err) {
              console.error('Image compression failed, uploading original:', err)
            }
          }

          const formData = new FormData()
          formData.append('file', fileToUpload)
          
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          })
          
          if (!uploadRes.ok) {
            const errorData = await uploadRes.json()
            throw new Error(errorData.error || '上传失败')
          }
          
          const uploadData = await uploadRes.json()
          return { url: uploadData.url, type: file.type }
        })

        const uploadResults = await Promise.all(uploadPromises)
        
        for (const result of uploadResults) {
          if (result.type.startsWith('image/')) {
            imageUrls.push(result.url)
          } else if (result.type.startsWith('video/')) {
            videoUrl = result.url
          }
        }
      }

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, imageUrls, videoUrl, userId }),
      })
      
      if (res.ok) {
        setContent('')
        setSelectedFiles([])
        const fileInput = document.getElementById('fileInput') as HTMLInputElement
        if (fileInput) fileInput.value = ''
        fetchPosts(1, true)
      } else {
        const errorData = await res.json()
        throw new Error(errorData.error || '发布动态失败')
      }
    } catch (error) {
      console.error('Error creating post:', error)
      const errorMessage = error instanceof Error ? error.message : '发布失败，请重试'
      alert(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  // Helper function to compress images using Canvas
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // Max dimensions
          const MAX_WIDTH = 1600
          const MAX_HEIGHT = 1600

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                })
                resolve(compressedFile)
              } else {
                reject(new Error('Canvas toBlob failed'))
              }
            },
            'image/jpeg',
            0.8 // Quality
          )
        }
        img.onerror = reject
      }
      reader.onerror = reject
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-extrabold text-green-800 tracking-tight">村口动态墙</h1>
        <p className="mt-2 text-lg text-green-600">看看大家都在种什么</p>
      </div>

      {/* Filter and Create Post Container */}
      <div className="flex flex-col gap-4">
        {/* Garden Filter */}
        <div className="flex items-center gap-2 bg-white p-3 rounded-lg shadow-sm border border-stone-200">
          <span className="text-sm font-medium text-gray-700">筛选菜园:</span>
          <select 
            value={selectedGardenId} 
            onChange={(e) => handleGardenChange(e.target.value)}
            className="text-sm border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
          >
            <option value="all">所有菜园</option>
            {gardens.map(g => (
              <option key={g.id} value={g.id}>{g.name || g.inviteCode}</option>
            ))}
          </select>
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
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  const files = Array.from(e.target.files)
                  if (files.length > 9) {
                    alert('最多只能选择9张图片')
                    e.target.value = ''
                    return
                  }
                  setSelectedFiles(files)
                }
              }}
              className="w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-green-50 file:text-green-700
                hover:file:bg-green-100"
            />
            {selectedFiles.length > 0 && (
              <p className="text-xs text-gray-500">已选择 {selectedFiles.length} 个文件</p>
            )}
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
      </div>

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
                  <video 
                    playsInline 
                    muted 
                    controls 
                    className="w-full h-auto max-h-[500px]"
                  >
                    <source src={post.videoUrl} />
                    Your browser does not support the video tag.
                  </video>
                </div>
              ) : post.imageUrls && post.imageUrls.length > 0 && (
                <div className={`grid gap-0.5 w-full bg-stone-100 ${
                  post.imageUrls.length === 1 ? 'grid-cols-1' : 
                  post.imageUrls.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'
                }`}>
                  {post.imageUrls.map((url, idx) => (
                    <div 
                      key={idx} 
                      className={`relative cursor-pointer overflow-hidden aspect-square ${
                        post.imageUrls.length === 1 ? 'aspect-auto max-h-[500px]' : ''
                      }`}
                      onClick={() => setPreviewImage(url)}
                    >
                      <img
                        src={url}
                        alt={`Post image ${idx + 1}`}
                        className="w-full h-full object-cover mx-auto"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image'
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900">{post.user.name}</span>
                    <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-100 w-fit">
                      来自: {post.garden.name || post.garden.inviteCode}
                    </span>
                  </div>
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

      {/* Pagination */}
      {hasMore && (
        <div className="flex justify-center pb-8">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="bg-white border border-green-600 text-green-600 px-8 py-2 rounded-full hover:bg-green-50 transition-colors disabled:opacity-50"
          >
            {loadingMore ? '加载中...' : '加载更多'}
          </button>
        </div>
      )}

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
