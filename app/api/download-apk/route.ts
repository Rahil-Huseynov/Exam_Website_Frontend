import { NextResponse } from "next/server"
import { createReadStream, existsSync } from "fs"
import { join } from "path"
import { Readable } from "stream"

export const runtime = "nodejs"

export async function GET() {
  const apkPath = join(
    process.cwd(),
    "android",
    "app",
    "build",
    "outputs",
    "apk",
    "release",
    "ImtahanVer-v1.0.apk"
  )

  if (!existsSync(apkPath)) {
    return NextResponse.json(
      { message: "APK not found" },
      { status: 404 }
    )
  }

  const stream = createReadStream(apkPath)

  return new Response(Readable.toWeb(stream) as ReadableStream, {
    headers: {
      "Content-Type": "application/vnd.android.package-archive",
      "Content-Disposition": 'attachment; filename="ImtahanVer-v1.0.apk"',
      "Cache-Control": "no-store",
    },
  })
}