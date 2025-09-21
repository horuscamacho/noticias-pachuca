"use client"

import { useState } from 'react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  IconExternalLink,
  IconHeart,
  IconMessage,
  IconShare,
  IconCalendar,
  IconUser,
  IconPhoto,
  IconVideo,
  IconLink,
  IconFileText,
  IconCopy,
  IconX,
} from '@tabler/icons-react'
import { ImageLightbox } from './ImageLightbox'

interface PostDetailsModalProps {
  post: {
    _id: string
    pageId: string
    facebookPostId: string
    postUrl: string
    content: {
      text?: string
      type: 'text' | 'photo' | 'video' | 'link' | 'event'
      images?: string[]
      videos?: string[]
      links?: string[]
    }
    publishedAt: string
    extractedAt: string
    engagement: {
      likes?: number
      comments?: number
      shares?: number
    }
    rawData: {
      author?: {
        name: string
        url?: string
        profile_picture_url?: string
      }
      album_preview?: Array<{
        image_file_uri: string
        url: string
        id: string
      }>
      reactions?: {
        angry?: number
        care?: number
        haha?: number
        like?: number
        love?: number
        sad?: number
        wow?: number
      }
    }
  } | null
  isOpen: boolean
  onClose: () => void
}

export function PostDetailsModal({ post, isOpen, onClose }: PostDetailsModalProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  if (!post) return null

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const formatEngagement = (value?: number) => {
    if (!value) return '0'
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toString()
  }

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'photo': return <IconPhoto className="w-4 h-4" />
      case 'video': return <IconVideo className="w-4 h-4" />
      case 'link': return <IconLink className="w-4 h-4" />
      case 'event': return <IconCalendar className="w-4 h-4" />
      default: return <IconFileText className="w-4 h-4" />
    }
  }

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'photo': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'video': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'link': return 'bg-green-100 text-green-800 border-green-200'
      case 'event': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPageName = () => {
    return post.rawData?.author?.name || `Página ${post.pageId}`
  }

  const getAllImages = () => {
    const images: string[] = []
    if (post.content.images) {
      images.push(...post.content.images)
    }
    if (post.rawData?.album_preview) {
      images.push(...post.rawData.album_preview.map(img => img.image_file_uri))
    }
    return [...new Set(images)] // Remove duplicates
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const totalReactions = post.rawData?.reactions ?
    Object.values(post.rawData.reactions).reduce((sum, count) => sum + (count || 0), 0) :
    (post.engagement?.likes || 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[75vw] !w-[75vw] max-h-[90vh] overflow-hidden sm:!max-w-[75vw] flex flex-col">
        {/* Fixed Header */}
        <div className="flex-shrink-0 sticky top-0 bg-white z-0 pb-4 border-b mt-2">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {getPostTypeIcon(post.content?.type || 'text')}
                <DialogTitle>Vista Previa del Post</DialogTitle>
              </div>
              <Badge className={getPostTypeColor(post.content?.type || 'text')}>
                {post.content?.type || 'text'}
              </Badge>
            </div>
            <DialogDescription>
              Detalles completos del post extraído de Facebook
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-6">
          {/* Author & Page Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <IconUser className="w-5 h-5" />
                Información de la Página
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                {post.rawData?.author?.profile_picture_url && (
                  <img
                    src={post.rawData.author.profile_picture_url}
                    alt="Profile"
                    className="w-12 h-12 rounded-full object-cover border"
                  />
                )}
                <div>
                  <p className="font-medium">{getPageName()}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(post.publishedAt), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <IconCalendar className="w-4 h-4" />
                  <span>Publicado: {format(new Date(post.publishedAt), 'dd/MM/yyyy HH:mm')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>Extraído: {format(new Date(post.extractedAt), 'dd/MM/yyyy HH:mm')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Post Content */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Contenido del Post</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {post.content?.text && (
                <div>
                  <h4 className="font-medium mb-2">Texto</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {post.content.text}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => copyToClipboard(post.content.text || '')}
                  >
                    <IconCopy className="w-4 h-4 mr-1" />
                    Copiar texto
                  </Button>
                </div>
              )}

              {/* Images */}
              {getAllImages().length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Imágenes ({getAllImages().length})</h4>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {getAllImages().map((image, index) => (
                      <div
                        key={index}
                        className="relative group cursor-pointer"
                        onClick={() => openLightbox(index)}
                      >
                        <img
                          src={image}
                          alt={`Post image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border transition-all group-hover:brightness-75 group-hover:scale-105"
                          onLoad={(e) => {
                            console.log('✅ Image loaded and should be visible:', image)
                          }}
                          onError={(e) => {
                            console.error('❌ Failed to load image:', image)
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-white/90 rounded-full p-1.5">
                            <IconPhoto className="w-4 h-4 text-gray-700" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* External Links */}
              {post.content?.links && post.content.links.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Enlaces Externos</h4>
                  <div className="space-y-2">
                    {post.content.links.map((link, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <IconLink className="w-4 h-4 text-green-600" />
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm truncate flex-1"
                        >
                          {link}
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(link)}
                        >
                          <IconCopy className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Engagement Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Estadísticas de Interacción</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <IconHeart className="w-6 h-6 mx-auto mb-1 text-red-600" />
                  <p className="text-2xl font-bold text-red-600">
                    {formatEngagement(post.engagement?.likes)}
                  </p>
                  <p className="text-sm text-gray-600">Likes</p>
                </div>

                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <IconMessage className="w-6 h-6 mx-auto mb-1 text-blue-600" />
                  <p className="text-2xl font-bold text-blue-600">
                    {formatEngagement(post.engagement?.comments)}
                  </p>
                  <p className="text-sm text-gray-600">Comentarios</p>
                </div>

                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <IconShare className="w-6 h-6 mx-auto mb-1 text-green-600" />
                  <p className="text-2xl font-bold text-green-600">
                    {formatEngagement(post.engagement?.shares)}
                  </p>
                  <p className="text-sm text-gray-600">Shares</p>
                </div>

                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <IconHeart className="w-6 h-6 mx-auto mb-1 text-purple-600" />
                  <p className="text-2xl font-bold text-purple-600">
                    {formatEngagement(totalReactions)}
                  </p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
              </div>

              {/* Detailed Reactions */}
              {post.rawData?.reactions && (
                <div className="mt-4">
                  <h5 className="font-medium mb-2">Reacciones Detalladas</h5>
                  <div className="grid grid-cols-4 md:grid-cols-7 gap-3 text-center">
                    {Object.entries(post.rawData.reactions).map(([reaction, count]) => (
                      <div key={reaction} className="p-2 bg-gray-50 rounded text-xs">
                        <div className="capitalize font-medium">{reaction}</div>
                        <div className="text-gray-600">{count || 0}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 sticky bottom-0 bg-white z-10 pt-4 border-t">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Metadatos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <span className="font-medium">ID del Post:</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {post.facebookPostId}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(post.facebookPostId)}
                    >
                      <IconCopy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <span className="font-medium">ID de Página:</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {post.pageId}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(post.pageId)}
                    >
                      <IconCopy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-center">
                <Button asChild>
                  <a
                    href={post.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <IconExternalLink className="w-4 h-4" />
                    Ver Post Original en Facebook
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Image Lightbox */}
        <ImageLightbox
          images={getAllImages()}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          initialIndex={lightboxIndex}
        />
      </DialogContent>
    </Dialog>
  )
}