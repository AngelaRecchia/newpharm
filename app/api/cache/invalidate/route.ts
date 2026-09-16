import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { clearCacheVersion } from "@/lib/api/storyblok/config";
import { clearStoriesByComponentCache } from "@/lib/api/storyblok/stories";

/**
 * API Route per invalidare la cache di Storyblok
 * Chiamata automaticamente quando il bridge di Storyblok rileva un cambio
 */
export async function POST() {
  try {
    clearCacheVersion();
    clearStoriesByComponentCache();

    const cacheDir = path.join(process.cwd(), ".cache", "storyblok");

    try {
      await fs.access(cacheDir);
    } catch {
      return NextResponse.json({
        success: true,
        message: "Memory cache cleared",
      });
    }

    const files = await fs.readdir(cacheDir);

    await Promise.all(
      files.map((file) => {
        const filePath = path.join(cacheDir, file);
        return fs.unlink(filePath).catch(() => {});
      })
    );

    return NextResponse.json({
      success: true,
      message: `Invalidated ${files.length} cache files`,
    });
  } catch (error) {
    console.error("Error invalidating cache:", error);
    return NextResponse.json(
      { success: false, error: "Failed to invalidate cache" },
      { status: 500 }
    );
  }
}
