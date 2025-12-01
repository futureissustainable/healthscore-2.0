"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { X, Heart, MessageSquare, Share2, Send, Users, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CommunityPost {
  id: string
  userId: string
  userName: string
  userImage?: string
  productName: string
  score: number
  category: string
  comment?: string
  imageUrl?: string
  likes: number
  createdAt: number
}

interface CommunityModalProps {
  isOpen: boolean
  onClose: () => void
  onSearch?: (term: string) => void
}

export function CommunityModal({ isOpen, onClose, onSearch }: CommunityModalProps) {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [newPost, setNewPost] = useState({
    productName: "",
    score: 75,
    category: "Food",
    comment: "",
  })
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (isOpen) {
      fetchPosts()
    }
  }, [isOpen])

  const fetchPosts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/community")
      const data = await response.json()
      setPosts(data.posts || [])
    } catch (error) {
      console.error("Error fetching community posts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreatePost = async () => {
    if (!session) return

    try {
      const response = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          ...newPost,
        }),
      })
      const data = await response.json()

      if (data.post) {
        setPosts([data.post, ...posts])
        setShowCreatePost(false)
        setNewPost({ productName: "", score: 75, category: "Food", comment: "" })
      }
    } catch (error) {
      console.error("Error creating post:", error)
    }
  }

  const handleLike = async (postId: string) => {
    if (!session) return

    const isLiked = likedPosts.has(postId)

    try {
      await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isLiked ? "unlike" : "like",
          postId,
        }),
      })

      // Update local state
      if (isLiked) {
        likedPosts.delete(postId)
        setPosts(
          posts.map((p) =>
            p.id === postId ? { ...p, likes: Math.max(0, p.likes - 1) } : p
          )
        )
      } else {
        likedPosts.add(postId)
        setPosts(
          posts.map((p) =>
            p.id === postId ? { ...p, likes: p.likes + 1 } : p
          )
        )
      }
      setLikedPosts(new Set(likedPosts))
    } catch (error) {
      console.error("Error liking post:", error)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-100"
    if (score >= 70) return "text-lime-600 bg-lime-100"
    if (score >= 50) return "text-yellow-600 bg-yellow-100"
    if (score >= 30) return "text-orange-600 bg-orange-100"
    return "text-red-600 bg-red-100"
  }

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return "just now"
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Community</h2>
              <p className="text-slate-600 mt-0.5">See what others are scanning</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Trending Banner */}
        <div className="px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Trending today</span>
          </div>
          {session && (
            <Button
              onClick={() => setShowCreatePost(true)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Share a Scan
            </Button>
          )}
        </div>

        {/* Create Post Form */}
        {showCreatePost && session && (
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <div className="space-y-4">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={newPost.productName}
                  onChange={(e) => setNewPost({ ...newPost, productName: e.target.value })}
                  placeholder="Product name..."
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={newPost.category}
                  onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                  className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Food">Food</option>
                  <option value="Beverage">Beverage</option>
                  <option value="PersonalCare">Personal Care</option>
                </select>
              </div>
              <div className="flex items-center space-x-4">
                <label className="text-sm text-slate-600">Score:</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newPost.score}
                  onChange={(e) => setNewPost({ ...newPost, score: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="font-bold text-slate-900 w-12">{newPost.score}</span>
              </div>
              <textarea
                value={newPost.comment}
                onChange={(e) => setNewPost({ ...newPost, comment: e.target.value })}
                placeholder="Add a comment (optional)..."
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreatePost(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreatePost}
                  disabled={!newPost.productName}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Posts Feed */}
        <div className="overflow-y-auto max-h-[55vh] p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No posts yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Be the first to share your health discoveries!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow"
                >
                  {/* Post Header */}
                  <div className="flex items-center space-x-3 mb-3">
                    {post.userImage ? (
                      <img
                        src={post.userImage}
                        alt={post.userName}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium">
                        {post.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{post.userName}</p>
                      <p className="text-xs text-slate-500">
                        {formatTimeAgo(post.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(post.score)}`}
                    >
                      {post.score}
                    </span>
                  </div>

                  {/* Post Content */}
                  <div
                    className="mb-3 cursor-pointer"
                    onClick={() => {
                      onSearch?.(post.productName)
                      onClose()
                    }}
                  >
                    <h4 className="font-semibold text-slate-900 hover:text-blue-600 transition-colors">
                      {post.productName}
                    </h4>
                    {post.comment && (
                      <p className="text-slate-600 mt-1 text-sm">{post.comment}</p>
                    )}
                    <span className="text-xs text-slate-400 mt-2 inline-block">
                      {post.category}
                    </span>
                  </div>

                  {/* Post Actions */}
                  <div className="flex items-center space-x-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center space-x-1.5 text-sm transition-colors ${
                        likedPosts.has(post.id)
                          ? "text-red-500"
                          : "text-slate-500 hover:text-red-500"
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          likedPosts.has(post.id) ? "fill-red-500" : ""
                        }`}
                      />
                      <span>{post.likes}</span>
                    </button>
                    <button
                      onClick={() => {
                        onSearch?.(post.productName)
                        onClose()
                      }}
                      className="flex items-center space-x-1.5 text-sm text-slate-500 hover:text-blue-500 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Scan</span>
                    </button>
                    <button className="flex items-center space-x-1.5 text-sm text-slate-500 hover:text-blue-500 transition-colors">
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!session && (
          <div className="p-4 border-t border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 text-center">
            <p className="text-sm text-slate-600">
              Sign in to share your scans and interact with the community
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
