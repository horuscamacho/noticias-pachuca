// 🎯 Create Facebook Page Sheet - Two-Step Process
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Plus, CheckCircle, Globe, Users, Loader2, ExternalLink } from 'lucide-react'

import { useFacebookPageValidation } from '../hooks/useFacebookPageValidation'
import { useFacebookPages } from '../hooks/useFacebookPages'

// 🎯 Form Schemas
const urlValidationSchema = z.object({
  pageUrl: z.string()
    .min(1, 'URL is required')
    .url('Must be a valid URL')
    .refine(
      (url) => {
        try {
          const parsedUrl = new URL(url)
          const hostname = parsedUrl.hostname.toLowerCase()
          return hostname === 'facebook.com' ||
                 hostname === 'www.facebook.com' ||
                 hostname === 'm.facebook.com'
        } catch {
          return false
        }
      },
      'Must be a valid Facebook URL'
    )
})

const pageConfigSchema = z.object({
  pageName: z.string().min(1, 'Page name is required'),
  category: z.string().min(1, 'Category is required'),
  isActive: z.boolean().default(true),
  extractionConfig: z.object({
    maxPosts: z.number().min(1).max(100).default(50),
    frequency: z.enum(['manual', 'daily', 'weekly']).default('manual'),
    fields: z.array(z.string()).default(['message', 'created_time', 'likes', 'shares', 'comments'])
  }).optional()
})

type UrlValidationForm = z.infer<typeof urlValidationSchema>
type PageConfigForm = z.infer<typeof pageConfigSchema>

interface CreateFacebookPageSheetProps {
  children?: React.ReactNode
}

export function CreateFacebookPageSheet({ children }: CreateFacebookPageSheetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<'validation' | 'configuration'>('validation')

  // 🎣 Hooks
  const {
    validatePage,
    validatedPageData,
    isValidating,
    validationError,
    clearValidation
  } = useFacebookPageValidation()

  const { createPageFromUrl } = useFacebookPages()

  // 📝 Forms
  const urlForm = useForm<UrlValidationForm>({
    resolver: zodResolver(urlValidationSchema),
    defaultValues: { pageUrl: '' }
  })

  const configForm = useForm<PageConfigForm>({
    resolver: zodResolver(pageConfigSchema),
    defaultValues: {
      pageName: '',
      category: '',
      isActive: true,
      extractionConfig: {
        maxPosts: 50,
        frequency: 'manual',
        fields: ['message', 'created_time', 'likes', 'shares', 'comments']
      }
    }
  })

  // 🔄 Handle URL validation
  const handleUrlValidation = async (data: UrlValidationForm) => {
    try {
      const pageData = await validatePage(data.pageUrl)

      // Pre-populate configuration form
      configForm.setValue('pageName', pageData.pageName)
      configForm.setValue('category', pageData.category)

      // Move to configuration step
      setStep('configuration')
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  // ✅ Handle final page creation
  const handlePageCreation = async (data: PageConfigForm) => {
    if (!validatedPageData) return

    try {
      await createPageFromUrl(urlForm.getValues('pageUrl'), {
        isActive: data.isActive,
        extractionConfig: data.extractionConfig
      })

      // Reset and close
      handleReset()
      setIsOpen(false)
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  // 🔄 Reset form state
  const handleReset = () => {
    setStep('validation')
    urlForm.reset()
    configForm.reset()
    clearValidation()
  }

  // 🔙 Go back to validation step
  const handleBackToValidation = () => {
    setStep('validation')
    clearValidation()
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) handleReset()
    }}>
      <SheetTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Facebook Page
          </Button>
        )}
      </SheetTrigger>

      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add Facebook Page</SheetTitle>
          <SheetDescription>
            Monitor a Facebook page for content extraction and analytics
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-4">
          {/* Step 1: URL Validation */}
          {step === 'validation' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <h3 className="text-lg font-medium">Facebook Page URL</h3>
              </div>

              <Form {...urlForm}>
                <form onSubmit={urlForm.handleSubmit(handleUrlValidation)} className="space-y-4">
                  <FormField
                    control={urlForm.control}
                    name="pageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Page URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://www.facebook.com/PageName"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the Facebook page URL you want to monitor
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isValidating}
                    className="w-full"
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Validating Page...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Validate URL
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          )}

          {/* Step 2: Configuration */}
          {step === 'configuration' && validatedPageData && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <h3 className="text-lg font-medium">Page Configuration</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToValidation}
                >
                  ← Back
                </Button>
              </div>

              {/* Page Preview Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Page Preview</CardTitle>
                    <Badge variant={validatedPageData.verified ? "default" : "secondary"}>
                      {validatedPageData.verified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{validatedPageData.pageName}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {validatedPageData.category}
                  </div>
                  {validatedPageData.followerCount && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{validatedPageData.followerCount.toLocaleString()} followers</span>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    ID: {validatedPageData.pageId}
                  </div>
                </CardContent>
              </Card>

              <Separator />

              {/* Configuration Form */}
              <Form {...configForm}>
                <form onSubmit={configForm.handleSubmit(handlePageCreation)} className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Basic Information</h4>

                    <FormField
                      control={configForm.control}
                      name="pageName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Page Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={configForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={configForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Active Monitoring</FormLabel>
                            <FormDescription>
                              Start monitoring this page immediately
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Extraction Configuration */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Extraction Settings</h4>

                    <FormField
                      control={configForm.control}
                      name="extractionConfig.frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Extraction Frequency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="manual">Manual</SelectItem>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            How often to extract new posts from this page
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={configForm.control}
                      name="extractionConfig.maxPosts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Posts per Extraction</FormLabel>
                          <FormControl>
                            <div className="space-y-3">
                              <Slider
                                min={1}
                                max={100}
                                step={1}
                                value={[field.value || 50]}
                                onValueChange={(values) => field.onChange(values[0])}
                                className="w-full"
                              />
                              <div className="text-sm text-muted-foreground text-center">
                                {field.value || 50} posts
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Maximum number of posts to extract in each job
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Actions */}
                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={configForm.formState.isSubmitting}
                    >
                      {configForm.formState.isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Page'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}