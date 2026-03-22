'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

interface Post {
  id: number
  content: string
  imageUrls: string[]
  videoUrl?: string
  createdAt: string
  user: {
    id: number
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
  const [preview, setPreview] = useState<{ urls: string[]; index: number } | null>(null)
  const touchStartXRef = useRef<number | null>(null)

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
      const res = await fetch(`/api/posts?page=${pageNum}&gardenId=${gid}&t=${Date.now()}`)
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
    const storedUserId = localStorage.getItem('userId')
    setUserId(storedUserId)
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

  const openPreview = (urls: string[], index: number) => {
    if (!urls?.length) return
    const safeIndex = Math.min(Math.max(index, 0), urls.length - 1)
    setPreview({ urls, index: safeIndex })
  }

  const closePreview = () => setPreview(null)

  const goPrev = () => {
    setPreview((p) => {
      if (!p) return p
      const nextIndex = (p.index - 1 + p.urls.length) % p.urls.length
      return { ...p, index: nextIndex }
    })
  }

  const goNext = () => {
    setPreview((p) => {
      if (!p) return p
      const nextIndex = (p.index + 1) % p.urls.length
      return { ...p, index: nextIndex }
    })
  }

  useEffect(() => {
    if (!preview) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePreview()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [preview])

  const handleDeletePost = async (id: number) => {
    if (!confirm('确定要删除这条动态吗？')) return

    try {
      const res = await fetch('/api/posts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        fetchPosts(1, true)
      } else {
        const errorData = await res.json()
        alert(errorData.error || '删除失败')
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('发生错误，请重试')
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
        const uploadToCos = async (file: File) => {
          const tokenRes = await fetch('/api/upload-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              filename: file.name,
              contentType: file.type,
              fileSize: file.size,
            })
          })

          const tokenData = await tokenRes.json().catch(() => ({}))
          if (!tokenRes.ok) {
            throw new Error(tokenData.error || '获取上传凭证失败')
          }

          const COSMod = await import('cos-js-sdk-v5')
          const COS: any = (COSMod as any).default || COSMod
          const cos = new COS({
            getAuthorization: (_options: any, callback: (auth: any) => void) => {
              callback({
                TmpSecretId: tokenData.credentials.tmpSecretId,
                TmpSecretKey: tokenData.credentials.tmpSecretKey,
                SecurityToken: tokenData.credentials.sessionToken,
                StartTime: tokenData.credentials.startTime,
                ExpiredTime: tokenData.credentials.expiredTime,
              })
            }
          })

          const isVideo = file.type.startsWith('video/')
          const useSlice = isVideo || file.size > 20 * 1024 * 1024

          await new Promise<void>((resolve, reject) => {
            if (useSlice) {
              cos.sliceUploadFile(
                {
                  Bucket: tokenData.bucket,
                  Region: tokenData.region,
                  Key: tokenData.key,
                  Body: file,
                  ContentType: file.type,
                  ChunkSize: isVideo ? 2 * 1024 * 1024 : 5 * 1024 * 1024,
                  AsyncLimit: isVideo ? 1 : 2,
                },
                (err: any) => {
                  if (err) reject(err)
                  else resolve()
                }
              )
            } else {
              cos.putObject(
                {
                  Bucket: tokenData.bucket,
                  Region: tokenData.region,
                  Key: tokenData.key,
                  Body: file,
                  ContentType: file.type,
                },
                (err: any) => {
                  if (err) reject(err)
                  else resolve()
                }
              )
            }
          })

          return tokenData.publicUrl as string
        }

        const uploadPromises = selectedFiles.map(async (file) => {
          let fileToUpload = file

          if (file.type.startsWith('image/') && file.size > 1024 * 1024) {
            try {
              const compressedFile = await compressImage(file)
              fileToUpload = compressedFile
            } catch (err) {
              console.error('Image compression failed, uploading original:', err)
            }
          }

          const url = await uploadToCos(fileToUpload)
          return { url, type: fileToUpload.type }
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
                      onClick={() => openPreview(post.imageUrls, idx)}
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
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                    {userId && Number(userId) === post.user.id && (
                      <button 
                        onClick={() => handleDeletePost(post.id)}
                        className="text-[10px] text-red-400 hover:text-red-600 transition-colors"
                      >
                        删除
                      </button>
                    )}
                  </div>
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
      {preview && (
        <div 
          className="fixed inset-0 bg-black z-[100] flex items-center justify-center p-0"
          onClick={closePreview}
        >
          <div 
            className="relative w-full h-full flex items-center justify-center select-none touch-pan-y"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              touchStartXRef.current = e.touches?.[0]?.clientX ?? null
            }}
            onTouchEnd={(e) => {
              const startX = touchStartXRef.current
              touchStartXRef.current = null
              if (startX == null) return
              const endX = e.changedTouches?.[0]?.clientX ?? startX
              const delta = endX - startX
              if (Math.abs(delta) < 40) return
              if (delta > 0) goPrev()
              else goNext()
            }}
          >
            <img
              src={preview.urls[preview.index]}
              alt="Full size preview"
              className="max-w-full max-h-full object-contain"
            />

            {preview.urls.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 text-white px-3 py-2 rounded-full hover:bg-black/60"
                >
                  ‹
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 text-white px-3 py-2 rounded-full hover:bg-black/60"
                >
                  ›
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/40 text-white text-xs px-3 py-1 rounded-full">
                  {preview.index + 1}/{preview.urls.length}
                </div>
              </>
            )}

            <button
              onClick={closePreview}
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
