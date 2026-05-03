'use client'

import { useEffect, useRef, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

const SDK_URL = 'https://cc-embed.adobe.com/sdk/v4/CCEverywhere.js'

const CANVAS_SIZES: { match: RegExp; width: number; height: number; label: string }[] = [
  { match: /reel|historia|story|video/i, width: 1080, height: 1920, label: '9:16 vertical' },
  { match: /carrusel|carousel/i,         width: 1080, height: 1080, label: 'Carrusel 1:1' },
  { match: /post/i,                       width: 1080, height: 1080, label: 'Post 1:1' },
]

function getCanvas(format: string) {
  for (const entry of CANVAS_SIZES) {
    if (entry.match.test(format)) return entry
  }
  return { width: 1080, height: 1080, label: '1:1 cuadrado' }
}

interface CCEditor {
  create(
    docConfig: { canvasSize: { width: number; height: number; unit: string } },
    appConfig: { callbacks: { onCancel: () => void; onPublish: (intent: string, params: unknown) => void; onError: (err: unknown) => void } },
    exportConfig: unknown[],
    containerConfig: unknown
  ): void
}

interface CCEverywhere {
  editor: CCEditor
}

declare global {
  interface Window {
    CCEverywhere?: {
      initialize(opts: { clientId: string; appName: string }): Promise<CCEverywhere>
    }
  }
}

export function AdobeExpressBtn({ format, brandName }: { format: string; brandName?: string }) {
  const clientId = process.env.NEXT_PUBLIC_ADOBE_CLIENT_ID
  const canvas = getCanvas(format)
  const editorRef = useRef<CCEditor | null>(null)
  const [sdkReady, setSdkReady] = useState(false)

  useEffect(() => {
    if (!clientId) return

    async function init() {
      if (editorRef.current) return
      try {
        if (!window.CCEverywhere) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script')
            script.src = SDK_URL
            script.async = true
            script.onload = () => resolve()
            script.onerror = reject
            document.head.appendChild(script)
          })
        }
        const cc = await window.CCEverywhere!.initialize({
          clientId: clientId!,
          appName: brandName ?? 'Adaptive Growth OS',
        })
        editorRef.current = cc.editor
        setSdkReady(true)
      } catch {
        // SDK failed — fallback to deeplink
      }
    }

    init()
  }, [clientId, brandName])

  function openDeeplink() {
    window.open('https://new.express.adobe.com', '_blank', 'noopener,noreferrer')
  }

  function handleClick() {
    if (!clientId || !sdkReady || !editorRef.current) {
      openDeeplink()
      return
    }

    editorRef.current.create(
      { canvasSize: { width: canvas.width, height: canvas.height, unit: 'px' } },
      {
        callbacks: {
          onCancel: () => {},
          onPublish: () => {},
          onError: () => openDeeplink(),
        },
      },
      [],
      {}
    )
  }

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      size="sm"
      className="gap-1.5 shrink-0"
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="36" rx="6" fill="#FF0000"/>
        <path d="M22.5 8h-9L8 20.5 13.5 28h9L28 15.5 22.5 8z" fill="white"/>
      </svg>
      Diseñar · {canvas.label}
      {!clientId && <ExternalLink className="h-3 w-3 opacity-40" />}
    </Button>
  )
}
