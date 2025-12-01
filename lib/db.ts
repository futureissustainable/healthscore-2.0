import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

// ============ SCAN HISTORY ============

export interface ScanHistoryItem {
  id: string
  userId: string
  productName: string
  score: number
  category: string
  imageUrl?: string
  nutrients?: any
  breakdown?: any
  healthierAddon?: any
  topInCategory?: any
  scannedAt: number
}

export async function addScanToHistory(
  userId: string,
  scanData: Omit<ScanHistoryItem, "id" | "userId" | "scannedAt">
): Promise<ScanHistoryItem> {
  const scan: ScanHistoryItem = {
    id: `scan_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    userId,
    ...scanData,
    scannedAt: Date.now(),
  }

  // Store the scan
  await redis.set(`scan:${scan.id}`, scan)

  // Add to user's scan history list (most recent first)
  await redis.lpush(`scan_history:${userId}`, scan.id)

  // Keep only last 500 scans per user
  await redis.ltrim(`scan_history:${userId}`, 0, 499)

  return scan
}

export async function getScanHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<ScanHistoryItem[]> {
  try {
    const scanIds = await redis.lrange(`scan_history:${userId}`, offset, offset + limit - 1)

    if (!scanIds || scanIds.length === 0) {
      return []
    }

    const scans: ScanHistoryItem[] = []
    for (const scanId of scanIds) {
      const scan = await redis.get(`scan:${scanId}`)
      if (scan) {
        scans.push(scan as ScanHistoryItem)
      }
    }

    return scans
  } catch (error) {
    console.error("Error getting scan history:", error)
    return []
  }
}

export async function getScanById(scanId: string): Promise<ScanHistoryItem | null> {
  try {
    const scan = await redis.get(`scan:${scanId}`)
    return scan as ScanHistoryItem | null
  } catch (error) {
    console.error("Error getting scan:", error)
    return null
  }
}

export async function deleteScan(userId: string, scanId: string): Promise<boolean> {
  try {
    // Verify ownership
    const scan = await getScanById(scanId)
    if (!scan || scan.userId !== userId) {
      return false
    }

    // Remove from list and delete scan
    await redis.lrem(`scan_history:${userId}`, 0, scanId)
    await redis.del(`scan:${scanId}`)

    return true
  } catch (error) {
    console.error("Error deleting scan:", error)
    return false
  }
}

// ============ FAVORITES ============

export interface FavoriteItem {
  id: string
  userId: string
  productName: string
  score: number
  category: string
  imageUrl?: string
  notes?: string
  addedAt: number
}

export async function addToFavorites(
  userId: string,
  productData: Omit<FavoriteItem, "id" | "userId" | "addedAt">
): Promise<FavoriteItem> {
  const favorite: FavoriteItem = {
    id: `fav_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    userId,
    ...productData,
    addedAt: Date.now(),
  }

  // Store the favorite
  await redis.set(`favorite:${favorite.id}`, favorite)

  // Add to user's favorites list
  await redis.sadd(`favorites:${userId}`, favorite.id)

  return favorite
}

export async function getFavorites(userId: string): Promise<FavoriteItem[]> {
  try {
    const favoriteIds = await redis.smembers(`favorites:${userId}`)

    if (!favoriteIds || favoriteIds.length === 0) {
      return []
    }

    const favorites: FavoriteItem[] = []
    for (const favId of favoriteIds) {
      const fav = await redis.get(`favorite:${favId}`)
      if (fav) {
        favorites.push(fav as FavoriteItem)
      }
    }

    // Sort by addedAt (most recent first)
    return favorites.sort((a, b) => b.addedAt - a.addedAt)
  } catch (error) {
    console.error("Error getting favorites:", error)
    return []
  }
}

export async function removeFromFavorites(userId: string, favoriteId: string): Promise<boolean> {
  try {
    // Verify ownership
    const favorite = await redis.get(`favorite:${favoriteId}`)
    if (!favorite || (favorite as FavoriteItem).userId !== userId) {
      return false
    }

    // Remove from set and delete favorite
    await redis.srem(`favorites:${userId}`, favoriteId)
    await redis.del(`favorite:${favoriteId}`)

    return true
  } catch (error) {
    console.error("Error removing favorite:", error)
    return false
  }
}

export async function isFavorite(userId: string, productName: string): Promise<boolean> {
  try {
    const favorites = await getFavorites(userId)
    return favorites.some((f) => f.productName.toLowerCase() === productName.toLowerCase())
  } catch (error) {
    console.error("Error checking favorite:", error)
    return false
  }
}

// ============ USER PREFERENCES ============

export interface DietaryPreferences {
  userId: string
  dietType: string // 'omnivore', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo', etc.
  allergies: string[]
  intolerances: string[]
  healthGoals: string[] // 'weight_loss', 'muscle_gain', 'heart_health', 'diabetes_management', etc.
  avoidIngredients: string[]
  preferredCuisines: string[]
  calorieTarget?: number
  proteinTarget?: number
  carbTarget?: number
  fatTarget?: number
  updatedAt: number
}

export async function savePreferences(
  userId: string,
  preferences: Omit<DietaryPreferences, "userId" | "updatedAt">
): Promise<DietaryPreferences> {
  const prefs: DietaryPreferences = {
    userId,
    ...preferences,
    updatedAt: Date.now(),
  }

  await redis.set(`preferences:${userId}`, prefs)
  return prefs
}

export async function getPreferences(userId: string): Promise<DietaryPreferences | null> {
  try {
    const prefs = await redis.get(`preferences:${userId}`)
    return prefs as DietaryPreferences | null
  } catch (error) {
    console.error("Error getting preferences:", error)
    return null
  }
}

// ============ MEAL PLANS ============

export interface MealPlanDay {
  date: string
  meals: {
    breakfast?: MealPlanItem
    lunch?: MealPlanItem
    dinner?: MealPlanItem
    snacks?: MealPlanItem[]
  }
}

export interface MealPlanItem {
  id: string
  name: string
  description: string
  healthScore: number
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  ingredients?: string[]
  instructions?: string[]
  prepTime?: number
  cookTime?: number
}

export interface MealPlan {
  id: string
  userId: string
  name: string
  days: MealPlanDay[]
  createdAt: number
  updatedAt: number
}

export async function saveMealPlan(
  userId: string,
  plan: Omit<MealPlan, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<MealPlan> {
  const mealPlan: MealPlan = {
    id: `mealplan_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    userId,
    ...plan,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  await redis.set(`mealplan:${mealPlan.id}`, mealPlan)
  await redis.sadd(`mealplans:${userId}`, mealPlan.id)

  return mealPlan
}

export async function getMealPlans(userId: string): Promise<MealPlan[]> {
  try {
    const planIds = await redis.smembers(`mealplans:${userId}`)

    if (!planIds || planIds.length === 0) {
      return []
    }

    const plans: MealPlan[] = []
    for (const planId of planIds) {
      const plan = await redis.get(`mealplan:${planId}`)
      if (plan) {
        plans.push(plan as MealPlan)
      }
    }

    return plans.sort((a, b) => b.updatedAt - a.updatedAt)
  } catch (error) {
    console.error("Error getting meal plans:", error)
    return []
  }
}

export async function getMealPlanById(planId: string): Promise<MealPlan | null> {
  try {
    const plan = await redis.get(`mealplan:${planId}`)
    return plan as MealPlan | null
  } catch (error) {
    console.error("Error getting meal plan:", error)
    return null
  }
}

export async function deleteMealPlan(userId: string, planId: string): Promise<boolean> {
  try {
    const plan = await getMealPlanById(planId)
    if (!plan || plan.userId !== userId) {
      return false
    }

    await redis.srem(`mealplans:${userId}`, planId)
    await redis.del(`mealplan:${planId}`)

    return true
  } catch (error) {
    console.error("Error deleting meal plan:", error)
    return false
  }
}

// ============ COMMUNITY ============

export interface CommunityPost {
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

export async function createCommunityPost(
  post: Omit<CommunityPost, "id" | "likes" | "createdAt">
): Promise<CommunityPost> {
  const communityPost: CommunityPost = {
    id: `post_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    ...post,
    likes: 0,
    createdAt: Date.now(),
  }

  await redis.set(`community_post:${communityPost.id}`, communityPost)

  // Add to global feed (score is timestamp for sorting)
  await redis.zadd("community_feed", { score: communityPost.createdAt, member: communityPost.id })

  // Add to user's posts
  await redis.sadd(`user_posts:${post.userId}`, communityPost.id)

  return communityPost
}

export async function getCommunityFeed(
  limit: number = 20,
  offset: number = 0
): Promise<CommunityPost[]> {
  try {
    const postIds = await redis.zrange("community_feed", -offset - limit, -offset - 1)

    if (!postIds || postIds.length === 0) {
      return []
    }

    const posts: CommunityPost[] = []
    for (const postId of postIds.reverse()) {
      const post = await redis.get(`community_post:${postId}`)
      if (post) {
        posts.push(post as CommunityPost)
      }
    }

    return posts
  } catch (error) {
    console.error("Error getting community feed:", error)
    return []
  }
}

export async function likeCommunityPost(postId: string, userId: string): Promise<boolean> {
  try {
    // Check if already liked
    const hasLiked = await redis.sismember(`post_likes:${postId}`, userId)
    if (hasLiked) {
      return false
    }

    // Add like
    await redis.sadd(`post_likes:${postId}`, userId)

    // Update post likes count
    const post = await redis.get(`community_post:${postId}`)
    if (post) {
      const updatedPost = { ...(post as CommunityPost), likes: (post as CommunityPost).likes + 1 }
      await redis.set(`community_post:${postId}`, updatedPost)
    }

    return true
  } catch (error) {
    console.error("Error liking post:", error)
    return false
  }
}

export async function unlikeCommunityPost(postId: string, userId: string): Promise<boolean> {
  try {
    const hasLiked = await redis.sismember(`post_likes:${postId}`, userId)
    if (!hasLiked) {
      return false
    }

    await redis.srem(`post_likes:${postId}`, userId)

    const post = await redis.get(`community_post:${postId}`)
    if (post) {
      const updatedPost = { ...(post as CommunityPost), likes: Math.max(0, (post as CommunityPost).likes - 1) }
      await redis.set(`community_post:${postId}`, updatedPost)
    }

    return true
  } catch (error) {
    console.error("Error unliking post:", error)
    return false
  }
}

// ============ DISCOVER FOODS ============

export interface DiscoverItem {
  id: string
  name: string
  description: string
  healthScore: number
  category: string
  imageUrl: string
  nutrition?: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
  tags: string[]
  featured: boolean
  createdAt: number
}

export async function getDiscoverItems(
  category?: string,
  limit: number = 20
): Promise<DiscoverItem[]> {
  try {
    const key = category ? `discover:${category}` : "discover:all"
    const itemIds = await redis.smembers(key)

    if (!itemIds || itemIds.length === 0) {
      return []
    }

    const items: DiscoverItem[] = []
    for (const itemId of itemIds) {
      const item = await redis.get(`discover_item:${itemId}`)
      if (item) {
        items.push(item as DiscoverItem)
      }
    }

    return items
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit)
  } catch (error) {
    console.error("Error getting discover items:", error)
    return []
  }
}

export async function getFeaturedDiscoverItems(): Promise<DiscoverItem[]> {
  try {
    const itemIds = await redis.smembers("discover:featured")

    if (!itemIds || itemIds.length === 0) {
      return []
    }

    const items: DiscoverItem[] = []
    for (const itemId of itemIds) {
      const item = await redis.get(`discover_item:${itemId}`)
      if (item && (item as DiscoverItem).featured) {
        items.push(item as DiscoverItem)
      }
    }

    return items.sort((a, b) => b.healthScore - a.healthScore)
  } catch (error) {
    console.error("Error getting featured items:", error)
    return []
  }
}
