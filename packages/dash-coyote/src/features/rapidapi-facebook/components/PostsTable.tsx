"use client"

import { useState } from 'react'
import { format } from 'date-fns'
import { useRapidAPIPosts } from '../hooks/useRapidAPIPosts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  IconExternalLink,
  IconHeart,
  IconMessage,
  IconShare,
  IconChevronLeft,
  IconChevronRight,
  IconLoader2
} from '@tabler/icons-react'

interface PostsTableProps {
  pageId: string
  pageName?: string
}

export function PostsTable({ pageId, pageName }: PostsTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const limit = 10

  const {
    data: postsData,
    isLoading,
    error,
    refetch
  } = useRapidAPIPosts({
    pageId,
    page: currentPage,
    limit,
  })

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <IconLoader2 className="h-4 w-4 animate-spin" />
            <span>Cargando posts...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-destructive mb-4">Error al cargar los posts</p>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const posts = postsData?.data || []
  const pagination = postsData?.pagination

  const formatEngagement = (value?: number) => {
    if (!value) return '0'
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toString()
  }

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'photo': return 'bg-blue-100 text-blue-800'
      case 'video': return 'bg-purple-100 text-purple-800'
      case 'link': return 'bg-green-100 text-green-800'
      case 'event': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Posts Extraídos {pageName && `- ${pageName}`}</span>
          <Badge variant="outline">
            {pagination?.total || 0} posts totales
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No hay posts extraídos para esta página</p>
            <p className="text-sm text-muted-foreground mt-2">
              Utiliza el botón de extracción para obtener posts de Facebook
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post._id || post.postId}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex gap-4">
                    {/* Image preview */}
                    {post.content?.images?.[0] && (
                      <div className="flex-shrink-0">
                        <img
                          src={post.content.images[0]}
                          alt="Post image"
                          className="w-20 h-20 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    )}

                    {/* Post content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getPostTypeColor(post.content?.type || 'text')}>
                            {post.content?.type || 'text'}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(post.publishedAt), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>
                        {post.url && (
                          <Button variant="ghost" size="sm" asChild>
                            <a
                              href={post.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0"
                            >
                              <IconExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>

                      {/* Post text */}
                      {post.content?.text && (
                        <p className="text-sm mb-3 line-clamp-3">
                          {post.content.text}
                        </p>
                      )}

                      {/* Engagement stats */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {post.engagement?.likes !== undefined && (
                          <div className="flex items-center gap-1">
                            <IconHeart className="h-4 w-4" />
                            <span>{formatEngagement(post.engagement.likes)}</span>
                          </div>
                        )}
                        {post.engagement?.comments !== undefined && (
                          <div className="flex items-center gap-1">
                            <IconMessage className="h-4 w-4" />
                            <span>{formatEngagement(post.engagement.comments)}</span>
                          </div>
                        )}
                        {post.engagement?.shares !== undefined && (
                          <div className="flex items-center gap-1">
                            <IconShare className="h-4 w-4" />
                            <span>{formatEngagement(post.engagement.shares)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Página {pagination.page} de {pagination.totalPages}
                  {' '}({pagination.total} posts totales)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!pagination.hasPrev}
                  >
                    <IconChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.hasNext}
                  >
                    Siguiente
                    <IconChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}