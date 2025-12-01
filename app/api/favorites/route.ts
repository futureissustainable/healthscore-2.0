import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, getUserByEmail } from "@/lib/auth"
import { getFavorites, addToFavorites, removeFromFavorites, isFavorite } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserByEmail(session.user.email)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const favorites = await getFavorites(user.id)

    return NextResponse.json({ favorites })
  } catch (error) {
    console.error("Error fetching favorites:", error)
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
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

    const { productName, score, category, imageUrl, notes } = await request.json()

    if (!productName || score === undefined || !category) {
      return NextResponse.json(
        { error: "Product name, score, and category are required" },
        { status: 400 }
      )
    }

    // Check if already favorited
    const alreadyFavorite = await isFavorite(user.id, productName)
    if (alreadyFavorite) {
      return NextResponse.json(
        { error: "Product is already in favorites" },
        { status: 400 }
      )
    }

    const favorite = await addToFavorites(user.id, {
      productName,
      score,
      category,
      imageUrl,
      notes,
    })

    return NextResponse.json({ favorite })
  } catch (error) {
    console.error("Error adding to favorites:", error)
    return NextResponse.json(
      { error: "Failed to add to favorites" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserByEmail(session.user.email)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { favoriteId } = await request.json()

    if (!favoriteId) {
      return NextResponse.json({ error: "Favorite ID required" }, { status: 400 })
    }

    const success = await removeFromFavorites(user.id, favoriteId)

    if (!success) {
      return NextResponse.json({ error: "Failed to remove favorite" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing favorite:", error)
    return NextResponse.json(
      { error: "Failed to remove favorite" },
      { status: 500 }
    )
  }
}
