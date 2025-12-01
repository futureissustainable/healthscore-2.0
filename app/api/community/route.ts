import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, getUserByEmail } from "@/lib/auth"
import {
  getCommunityFeed,
  createCommunityPost,
  likeCommunityPost,
  unlikeCommunityPost,
} from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")

    const posts = await getCommunityFeed(limit, offset)

    return NextResponse.json({
      posts,
      hasMore: posts.length === limit,
    })
  } catch (error) {
    console.error("Error fetching community feed:", error)
    return NextResponse.json(
      { error: "Failed to fetch community feed" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserByEmail(session.user.email)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { action, ...data } = await request.json()

    switch (action) {
      case "create": {
        const { productName, score, category, comment, imageUrl } = data

        if (!productName || score === undefined || !category) {
          return NextResponse.json(
            { error: "Product name, score, and category are required" },
            { status: 400 }
          )
        }

        const post = await createCommunityPost({
          userId: user.id,
          userName: user.name || "Anonymous",
          userImage: user.image,
          productName,
          score,
          category,
          comment,
          imageUrl,
        })

        return NextResponse.json({ post })
      }

      case "like": {
        const { postId } = data

        if (!postId) {
          return NextResponse.json({ error: "Post ID required" }, { status: 400 })
        }

        const success = await likeCommunityPost(postId, user.id)

        if (!success) {
          return NextResponse.json(
            { error: "Already liked or post not found" },
            { status: 400 }
          )
        }

        return NextResponse.json({ success: true })
      }

      case "unlike": {
        const { postId } = data

        if (!postId) {
          return NextResponse.json({ error: "Post ID required" }, { status: 400 })
        }

        const success = await unlikeCommunityPost(postId, user.id)

        if (!success) {
          return NextResponse.json(
            { error: "Not liked or post not found" },
            { status: 400 }
          )
        }

        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error processing community request:", error)
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    )
  }
}
