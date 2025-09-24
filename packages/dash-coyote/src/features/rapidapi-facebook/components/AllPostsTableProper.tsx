"use client"

import { useState } from 'react'
import { format } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/features/shared/services/apiClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  IconExternalLink,
  IconHeart,
  IconMessage,
  IconShare,
  IconChevronLeft,
  IconChevronRight,
  IconLoader2,
  IconSearch,
  IconFilter,
  IconColumns,
  IconEye,
  IconSortAscending,
  IconSortDescending,
  IconVideo,
} from '@tabler/icons-react'
import { PostDetailsModal } from './PostDetailsModal'

interface RapidAPIPost {
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
  }
}

interface PostsPaginationResponse {
  data: RapidAPIPost[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// 📄 Get ALL Posts from all pages
const getAllPosts = async (
  pagination: { page?: number; limit?: number } = {}
): Promise<PostsPaginationResponse> => {
  return await apiClient.get<PostsPaginationResponse>(`/rapidapi-facebook/posts`, {
    params: pagination
  })
}

// 🎣 Hook to get all posts
function useAllPosts({ page = 1, limit = 10 }: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ['all-posts', page, limit],
    queryFn: () => getAllPosts({ page, limit }),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Column visibility management
interface ColumnVisibility {
  page: boolean
  type: boolean
  text: boolean
  image: boolean
  video: boolean
  url: boolean
  likes: boolean
  comments: boolean
  shares: boolean
  date: boolean
}

export function AllPostsTableProper() {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchText, setSearchText] = useState('')
  const [pageFilter, setPageFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<string>('publishedAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [pageSize, setPageSize] = useState(10)

  // Modal state for post details
  const [selectedPost, setSelectedPost] = useState<RapidAPIPost | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    page: true,
    type: true,
    text: true,
    image: true,
    video: true,
    url: true,
    likes: true,
    comments: true,
    shares: true,
    date: true,
  })

  const {
    data: postsData,
    isLoading,
    error,
    refetch
  } = useAllPosts({
    page: currentPage,
    limit: pageSize,
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
      case 'photo': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'video': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'link': return 'bg-green-100 text-green-800 border-green-200'
      case 'event': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPageName = (post: RapidAPIPost) => {
    return post.rawData?.author?.name || `Página ${post.pageId}`
  }

  const getPostImage = (post: RapidAPIPost) => {
    if (post.content.images?.[0]) return post.content.images[0]
    if (post.rawData?.album_preview?.[0]?.image_file_uri) {
      return post.rawData.album_preview[0].image_file_uri
    }
    return null
  }

  // Get unique pages and types for filters
  const uniquePages = Array.from(new Set(posts.map(getPageName)))
  const uniqueTypes = Array.from(new Set(posts.map(p => p.content.type)))

  // Filter and sort posts
  const filteredAndSortedPosts = posts
    .filter(post => {
      const matchesSearch = searchText === '' ||
        post.content.text?.toLowerCase().includes(searchText.toLowerCase()) ||
        getPageName(post).toLowerCase().includes(searchText.toLowerCase())

      const matchesPage = pageFilter === 'all' || getPageName(post) === pageFilter
      const matchesType = typeFilter === 'all' || post.content.type === typeFilter

      return matchesSearch && matchesPage && matchesType
    })
    .sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'publishedAt':
          aValue = new Date(a.publishedAt).getTime()
          bValue = new Date(b.publishedAt).getTime()
          break
        case 'likes':
          aValue = a.engagement?.likes || 0
          bValue = b.engagement?.likes || 0
          break
        case 'page':
          aValue = getPageName(a)
          bValue = getPageName(b)
          break
        case 'type':
          aValue = a.content.type
          bValue = b.content.type
          break
        default:
          return 0
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? <IconSortAscending className="w-4 h-4" /> : <IconSortDescending className="w-4 h-4" />
  }

  const toggleColumn = (column: keyof ColumnVisibility) => {
    setColumnVisibility(prev => ({
      ...prev,
      [column]: !prev[column]
    }))
  }

  const handleViewDetails = (post: RapidAPIPost) => {
    setSelectedPost(post)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedPost(null)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span>Todos los Posts Extraídos</span>
            <Badge variant="outline">
              {pagination?.total || 0} posts totales
            </Badge>
          </CardTitle>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconColumns className="h-4 w-4 mr-1" />
                  Columnas
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.page}
                  onCheckedChange={() => toggleColumn('page')}
                >
                  Página
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.type}
                  onCheckedChange={() => toggleColumn('type')}
                >
                  Tipo
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.text}
                  onCheckedChange={() => toggleColumn('text')}
                >
                  Texto
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.image}
                  onCheckedChange={() => toggleColumn('image')}
                >
                  Imagen
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.video}
                  onCheckedChange={() => toggleColumn('video')}
                >
                  Video
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.url}
                  onCheckedChange={() => toggleColumn('url')}
                >
                  URL Externa
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.likes}
                  onCheckedChange={() => toggleColumn('likes')}
                >
                  Likes
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.comments}
                  onCheckedChange={() => toggleColumn('comments')}
                >
                  Comentarios
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.shares}
                  onCheckedChange={() => toggleColumn('shares')}
                >
                  Shares
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.date}
                  onCheckedChange={() => toggleColumn('date')}
                >
                  Fecha
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Actualizar
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar posts..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-8 w-64"
            />
          </div>

          <Select value={pageFilter} onValueChange={setPageFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por página" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las páginas</SelectItem>
              {uniquePages.map((page) => (
                <SelectItem key={page} value={page}>
                  {page}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {uniqueTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 por página</SelectItem>
              <SelectItem value="25">25 por página</SelectItem>
              <SelectItem value="50">50 por página</SelectItem>
              <SelectItem value="100">100 por página</SelectItem>
            </SelectContent>
          </Select>

          {(searchText || pageFilter !== 'all' || typeFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchText('')
                setPageFilter('all')
                setTypeFilter('all')
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {filteredAndSortedPosts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchText || pageFilter !== 'all' || typeFilter !== 'all' ? 'No se encontraron posts que coincidan con los filtros' : 'No hay posts extraídos'}
            </p>
            {!(searchText || pageFilter !== 'all' || typeFilter !== 'all') && (
              <p className="text-sm text-muted-foreground mt-2">
                Utiliza las funciones de extracción para obtener posts de Facebook
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columnVisibility.page && (
                      <TableHead className="cursor-pointer" onClick={() => handleSort('page')}>
                        <div className="flex items-center gap-1">
                          Página
                          {getSortIcon('page')}
                        </div>
                      </TableHead>
                    )}
                    {columnVisibility.type && (
                      <TableHead className="cursor-pointer" onClick={() => handleSort('type')}>
                        <div className="flex items-center gap-1">
                          Tipo
                          {getSortIcon('type')}
                        </div>
                      </TableHead>
                    )}
                    {columnVisibility.text && (
                      <TableHead>Texto</TableHead>
                    )}
                    {columnVisibility.image && (
                      <TableHead>Imagen</TableHead>
                    )}
                    {columnVisibility.video && (
                      <TableHead>Video</TableHead>
                    )}
                    {columnVisibility.url && (
                      <TableHead>URL Externa</TableHead>
                    )}
                    {columnVisibility.likes && (
                      <TableHead className="cursor-pointer text-center" onClick={() => handleSort('likes')}>
                        <div className="flex items-center justify-center gap-1">
                          <IconHeart className="w-4 h-4" />
                          {getSortIcon('likes')}
                        </div>
                      </TableHead>
                    )}
                    {columnVisibility.comments && (
                      <TableHead className="text-center">
                        <IconMessage className="w-4 h-4 mx-auto" />
                      </TableHead>
                    )}
                    {columnVisibility.shares && (
                      <TableHead className="text-center">
                        <IconShare className="w-4 h-4 mx-auto" />
                      </TableHead>
                    )}
                    {columnVisibility.date && (
                      <TableHead className="cursor-pointer" onClick={() => handleSort('publishedAt')}>
                        <div className="flex items-center gap-1">
                          Fecha
                          {getSortIcon('publishedAt')}
                        </div>
                      </TableHead>
                    )}
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedPosts.map((post) => (
                    <TableRow key={post._id}>
                      {columnVisibility.page && (
                        <TableCell>
                          <Badge variant="secondary" className="font-medium">
                            {getPageName(post)}
                          </Badge>
                        </TableCell>
                      )}
                      {columnVisibility.type && (
                        <TableCell>
                          <Badge className={getPostTypeColor(post.content?.type || 'text')}>
                            {post.content?.type || 'text'}
                          </Badge>
                        </TableCell>
                      )}
                      {columnVisibility.text && (
                        <TableCell className="max-w-[300px]">
                          <div className="line-clamp-2 text-sm">
                            {post.content?.text || <span className="text-muted-foreground italic">Sin texto</span>}
                          </div>
                        </TableCell>
                      )}
                      {columnVisibility.image && (
                        <TableCell>
                          {getPostImage(post) ? (
                            <img
                              src={getPostImage(post)!}
                              alt="Post image"
                              className="w-12 h-12 object-cover rounded border"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                              <span className="text-[10px] text-gray-400 text-center leading-tight">Sin<br/>imagen</span>
                            </div>
                          )}
                        </TableCell>
                      )}
                      {columnVisibility.video && (
                        <TableCell>
                          {post.content?.videos && post.content.videos.length > 0 ? (
                            <div className="flex items-center gap-1">
                              <div className="w-12 h-12 bg-purple-100 rounded border flex items-center justify-center">
                                <IconVideo className="w-6 h-6 text-purple-600" />
                              </div>
                              <span className="text-xs text-purple-600 font-medium">
                                {post.content.videos.length}
                              </span>
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                              <span className="text-[10px] text-gray-400 text-center leading-tight">Sin<br/>video</span>
                            </div>
                          )}
                        </TableCell>
                      )}
                      {columnVisibility.url && (
                        <TableCell>
                          {post.content?.links?.[0] ? (
                            <a
                              href={post.content.links[0]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm truncate block max-w-[200px]"
                            >
                              🔗 {post.content.links[0]}
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                      )}
                      {columnVisibility.likes && (
                        <TableCell className="text-center">
                          <span className="font-medium">
                            {formatEngagement(post.engagement?.likes)}
                          </span>
                        </TableCell>
                      )}
                      {columnVisibility.comments && (
                        <TableCell className="text-center">
                          <span className="font-medium">
                            {formatEngagement(post.engagement?.comments)}
                          </span>
                        </TableCell>
                      )}
                      {columnVisibility.shares && (
                        <TableCell className="text-center">
                          <span className="font-medium">
                            {formatEngagement(post.engagement?.shares)}
                          </span>
                        </TableCell>
                      )}
                      {columnVisibility.date && (
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(post.publishedAt), 'dd/MM/yyyy')}
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(post.publishedAt), 'HH:mm')}
                            </div>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(post)}
                            title="Ver detalles"
                          >
                            <IconEye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" asChild title="Ver en Facebook">
                            <a
                              href={post.postUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <IconExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} posts
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
                  <span className="text-sm">
                    Página {pagination.page} de {pagination.totalPages}
                  </span>
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

      {/* Post Details Modal */}
      <PostDetailsModal
        post={selectedPost}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </Card>
  )
}