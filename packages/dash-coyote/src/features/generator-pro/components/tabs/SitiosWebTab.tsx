import { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconTestPipe,
  IconWorld,
  IconClock,
  IconTrendingUp,
} from "@tabler/icons-react";

import {
  useWebsiteConfigs,
  useCreateWebsiteConfig,
  useUpdateWebsiteConfig,
  useTestSelectors,
  useTestListingSelectors,
  useTestIndividualContent,
  useExtractUrlsAndSave,
  useExtractContentFromUrls,
} from "../../hooks";
import type {
  TestSelectorsRequest,
  TestSelectorsResponse,
  CreateWebsiteConfigRequest,
  TestListingSelectorsRequest,
  TestIndividualContentRequest,
  TestListingResponse,
  TestContentResponse,
  WebsiteConfig,
} from "../../types";
import type { ExtractedUrl } from "../../schemas";

export function SitiosWebTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState<string | null>(null);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testResult, setTestResult] = useState<TestSelectorsResponse | null>(null);
  const [listingTestResult, setListingTestResult] = useState<TestListingResponse | null>(null);
  const [contentTestResult, setContentTestResult] = useState<TestContentResponse | null>(null);

  // Manual workflow states
  const [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = useState(false);
  const [currentWorkflowStep, setCurrentWorkflowStep] = useState<'extractUrls' | 'selectContent'>('extractUrls');
  const [extractedUrls, setExtractedUrls] = useState<string[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [currentWebsiteId, setCurrentWebsiteId] = useState<string>("");

  const { data: websites, isLoading } = useWebsiteConfigs();
  const createWebsite = useCreateWebsiteConfig();
  const updateWebsite = useUpdateWebsiteConfig();
  const testSelectors = useTestSelectors();
  const testListingSelectors = useTestListingSelectors();
  const testIndividualContent = useTestIndividualContent();

  // Manual workflow hooks
  const extractUrlsAndSave = useExtractUrlsAndSave();
  const extractContentFromUrls = useExtractContentFromUrls();

  const [formData, setFormData] = useState<CreateWebsiteConfigRequest>({
    name: "",
    baseUrl: "",
    listingUrl: "",
    testUrl: "",
    extractionFrequency: 60,
    generationFrequency: 120,
    listingSelectors: {
      articleLinks: "a[href]",
      titleSelector: "",
      imageSelector: "",
    },
    contentSelectors: {
      titleSelector: "",
      contentSelector: "",
      imageSelector: "",
      dateSelector: "",
      authorSelector: "",
      categorySelector: "",
    },
    extractionSettings: {
      maxUrlsPerExtraction: 10,
      duplicateFilter: true,
      contentFilters: {
        minContentLength: 100,
        excludeKeywords: [],
        requiredKeywords: [],
      },
    },
  });

  const handleSubmit = () => {
    if (editingWebsite) {
      updateWebsite.mutate(
        { id: editingWebsite, data: formData },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            setEditingWebsite(null);
            resetForm();
          },
        }
      );
    } else {
      createWebsite.mutate(formData, {
        onSuccess: () => {
          setIsDialogOpen(false);
          resetForm();
        },
      });
    }
  };

  const handleTestSelectors = () => {
    const testData: TestSelectorsRequest = {
      baseUrl: formData.baseUrl,
      listingUrl: formData.listingUrl,
      contentSelectors: formData.contentSelectors,
    };

    testSelectors.mutate(testData, {
      onSuccess: (result) => {
        setTestResult(result);
        setIsTestDialogOpen(true);
      },
    });
  };

  const handleTestListing = () => {
    const testData: TestListingSelectorsRequest = {
      baseUrl: formData.baseUrl,
      listingUrl: formData.listingUrl,
      listingSelectors: {
        articleLinks: formData.listingSelectors?.articleLinks || "a[href]",
        titleSelector: formData.listingSelectors?.titleSelector,
        imageSelector: formData.listingSelectors?.imageSelector,
      },
      limit: 10,
    };

    testListingSelectors.mutate(testData, {
      onSuccess: (result) => {
        setListingTestResult(result);
        setIsTestDialogOpen(true);
      },
    });
  };

  const handleTestContent = () => {
    if (!formData.testUrl) return;

    const testData: TestIndividualContentRequest = {
      testUrl: formData.testUrl,
      contentSelectors: formData.contentSelectors,
    };

    testIndividualContent.mutate(testData, {
      onSuccess: (result) => {
        setContentTestResult(result);
        setIsTestDialogOpen(true);
      },
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      baseUrl: "",
      listingUrl: "",
      testUrl: "",
      extractionFrequency: 60,
      generationFrequency: 120,
      contentSelectors: {
        titleSelector: "",
        contentSelector: "",
        imageSelector: "",
        dateSelector: "",
        authorSelector: "",
        categorySelector: "",
      },
      extractionSettings: {
        maxUrlsPerExtraction: 10,
        duplicateFilter: true,
        contentFilters: {
          minContentLength: 100,
          excludeKeywords: [],
          requiredKeywords: [],
        },
      },
    });
  };

  const handleEdit = (website: WebsiteConfig) => {
    setFormData({
      name: website.name,
      baseUrl: website.baseUrl,
      listingUrl: website.listingUrl,
      testUrl: website.testUrl || "",
      extractionFrequency: website.extractionFrequency,
      generationFrequency: website.generationFrequency,
      listingSelectors: website.listingSelectors || {
        articleLinks: "a[href]",
        titleSelector: "",
        imageSelector: "",
      },
      contentSelectors: website.contentSelectors || {
        titleSelector: "",
        contentSelector: "",
        imageSelector: "",
        dateSelector: "",
        authorSelector: "",
        categorySelector: "",
      },
      extractionSettings: website.extractionSettings || {
        maxUrlsPerExtraction: 10,
        duplicateFilter: true,
        contentFilters: {
          minContentLength: 100,
          excludeKeywords: [],
          requiredKeywords: [],
        },
      },
    });
    setEditingWebsite(website.id);
    setIsDialogOpen(true);
  };

  // Manual workflow handlers
  const handleManualExtractUrls = async (websiteId: string) => {
    try {
      setCurrentWebsiteId(websiteId);
      setCurrentWorkflowStep('extractUrls');
      setIsWorkflowDialogOpen(true);

      const result = await extractUrlsAndSave.mutateAsync(websiteId);
      // Extract just the URLs from the saved records
      const urls = result.extractedUrls.map((item: ExtractedUrl) => item.url || item);
      setExtractedUrls(urls);
      setCurrentWorkflowStep('selectContent');

      toast.success(`${urls.length} URLs extraídas y guardadas en BD`);
    } catch (error) {
      console.error('Error extracting URLs:', error);
      toast.error('Error al extraer URLs');
    }
  };

  const handleSelectUrls = async (urls: string[]) => {
    try {
      setSelectedUrls(urls);

      // Extract content from selected URLs and save to database
      const result = await extractContentFromUrls.mutateAsync({
        urls: urls,
        websiteId: currentWebsiteId
      });

      toast.success(`✅ ${result.totalProcessed} posts extraídos y guardados. Revisa la tab Posts.`);

      // Close modal after successful extraction
      setIsWorkflowDialogOpen(false);
      setCurrentWorkflowStep('extractUrls');
      setExtractedUrls([]);
      setSelectedUrls([]);
      setCurrentWebsiteId('');
    } catch (error) {
      console.error('Error extracting content:', error);
      toast.error('Error al extraer contenido');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-muted-foreground">
          Cargando configuraciones...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sitios Web de Noticias</h2>
          <p className="text-muted-foreground">
            Configura los sitios web de donde extraer noticias automáticamente
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setEditingWebsite(null);
              }}
            >
              <IconPlus className="h-4 w-4 mr-2" />
              Agregar Sitio
            </Button>
          </DialogTrigger>
          <DialogContent className="!max-w-6xl !max-h-[90vh] !min-h-[700px] !w-[90vw] !p-0 flex flex-col">
            <DialogHeader className="flex-shrink-0 px-12 pt-8 pb-4">
              <DialogTitle>
                {editingWebsite
                  ? "Editar Configuración de Sitio"
                  : "Agregar Nuevo Sitio Web"}
              </DialogTitle>
              <DialogDescription>
                Configura los selectores CSS y parámetros para extraer noticias
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-12 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pb-8">
              {/* Basic Info */}
              <div className="space-y-6">
                <div>
                  <Label htmlFor="name" className="!text-sm !font-medium">Nombre del sitio</Label>
                  <Input
                    id="name"
                    className="!h-12 !text-base !mt-2"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="ej. El Universal"
                  />
                </div>

                <div>
                  <Label htmlFor="baseUrl" className="!text-sm !font-medium">URL base</Label>
                  <Input
                    id="baseUrl"
                    className="!h-12 !text-base !mt-2"
                    value={formData.baseUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, baseUrl: e.target.value })
                    }
                    placeholder="https://ejemplo.com"
                  />
                </div>

                <div>
                  <Label htmlFor="listingUrl" className="!text-sm !font-medium">URL de listado de noticias</Label>
                  <Input
                    id="listingUrl"
                    className="!h-12 !text-base !mt-2"
                    value={formData.listingUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, listingUrl: e.target.value })
                    }
                    placeholder="https://ejemplo.com/noticias"
                  />
                </div>

                <div>
                  <Label htmlFor="testUrl" className="!text-sm !font-medium">
                    URL de prueba (opcional)
                    <span className="text-xs text-muted-foreground block mt-1">
                      URL específica de una noticia para probar selectores de contenido
                    </span>
                  </Label>
                  <Input
                    id="testUrl"
                    className="!h-12 !text-base !mt-2"
                    value={formData.testUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, testUrl: e.target.value })
                    }
                    placeholder="https://ejemplo.com/noticia-especifica"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="extractionFreq" className="!text-sm !font-medium">
                      Frecuencia extracción (min)
                    </Label>
                    <Input
                      id="extractionFreq"
                      type="number"
                      className="!h-12 !text-base !mt-2"
                      value={formData.extractionFrequency}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          extractionFrequency: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="generationFreq" className="!text-sm !font-medium">
                      Frecuencia generación (min)
                    </Label>
                    <Input
                      id="generationFreq"
                      type="number"
                      className="!h-12 !text-base !mt-2"
                      value={formData.generationFrequency}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          generationFrequency: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

              </div>

              {/* Listing Selectors */}
              <div className="space-y-6">
                <h3 className="font-semibold !text-lg">Selectores de Listado</h3>

                <div>
                  <Label htmlFor="articleLinks" className="!text-sm !font-medium">Selector de enlaces de artículos *</Label>
                  <Input
                    id="articleLinks"
                    className="!h-12 !text-base !mt-2"
                    value={formData.listingSelectors?.articleLinks || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        listingSelectors: {
                          ...formData.listingSelectors,
                          articleLinks: e.target.value,
                          titleSelector: formData.listingSelectors?.titleSelector || "",
                          imageSelector: formData.listingSelectors?.imageSelector || "",
                        },
                      })
                    }
                    placeholder="a[href*='/noticia'], .article-link, h2 a"
                    required
                  />
                  <p className="!text-xs !text-gray-600 !mt-1">
                    Selector para extraer enlaces de noticias desde el listado
                  </p>
                </div>
              </div>

              {/* Content Selectors */}
              <div className="space-y-6">
                <h3 className="font-semibold !text-lg">Selectores de Contenido</h3>

                <div>
                  <Label htmlFor="titleSelector" className="!text-sm !font-medium">Selector de título</Label>
                  <Input
                    id="titleSelector"
                    className="!h-12 !text-base !mt-2"
                    value={formData.contentSelectors.titleSelector}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contentSelectors: {
                          ...formData.contentSelectors,
                          titleSelector: e.target.value,
                        },
                      })
                    }
                    placeholder="h1.title, .article-title"
                  />
                </div>

                <div>
                  <Label htmlFor="contentSelector" className="!text-sm !font-medium">Selector de contenido</Label>
                  <Textarea
                    id="contentSelector"
                    className="!min-h-[120px] !text-base !mt-2 !p-4"
                    value={formData.contentSelectors.contentSelector}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contentSelectors: {
                          ...formData.contentSelectors,
                          contentSelector: e.target.value,
                        },
                      })
                    }
                    placeholder=".article-content, .post-body"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="imageSelector" className="!text-sm !font-medium">
                    Selector de imagen (opcional)
                  </Label>
                  <Input
                    id="imageSelector"
                    className="!h-12 !text-base !mt-2"
                    value={formData.contentSelectors.imageSelector || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contentSelectors: {
                          ...formData.contentSelectors,
                          imageSelector: e.target.value,
                        },
                      })
                    }
                    placeholder=".featured-image img, .article-image"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="authorSelector" className="!text-sm !font-medium">Autor (opcional)</Label>
                    <Input
                      id="authorSelector"
                      className="!h-12 !text-base !mt-2"
                      value={formData.contentSelectors.authorSelector || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contentSelectors: {
                            ...formData.contentSelectors,
                            authorSelector: e.target.value,
                          },
                        })
                      }
                      placeholder=".author, .byline"
                    />
                  </div>
                  <div>
                    <Label htmlFor="categorySelector" className="!text-sm !font-medium">
                      Categoría (opcional)
                    </Label>
                    <Input
                      id="categorySelector"
                      className="!h-12 !text-base !mt-2"
                      value={formData.contentSelectors.categorySelector || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contentSelectors: {
                            ...formData.contentSelectors,
                            categorySelector: e.target.value,
                          },
                        })
                      }
                      placeholder=".category, .tag"
                    />
                  </div>
                </div>
              </div>
            </div>
            </div>

            <DialogFooter className="flex-shrink-0 px-12 py-6 border-t space-x-4 flex flex-wrap gap-4">
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="!h-12 !px-6"
                  onClick={handleTestListing}
                  disabled={
                    testListingSelectors.isPending ||
                    !formData.baseUrl ||
                    !formData.listingUrl
                  }
                >
                  <IconTestPipe className="h-4 w-4 mr-2" />
                  Probar Listado
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="!h-12 !px-6"
                  onClick={handleTestContent}
                  disabled={
                    testIndividualContent.isPending ||
                    !formData.testUrl ||
                    !formData.contentSelectors.titleSelector ||
                    !formData.contentSelectors.contentSelector
                  }
                >
                  <IconTestPipe className="h-4 w-4 mr-2" />
                  Probar Contenido
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="!h-12 !px-6"
                  onClick={handleTestSelectors}
                  disabled={
                    testSelectors.isPending ||
                    !formData.baseUrl ||
                    !formData.listingUrl
                  }
                >
                  <IconTestPipe className="h-4 w-4 mr-2" />
                  Test Completo
                </Button>
              </div>
              <Button
                size="lg"
                className="!h-12 !px-8 ml-auto"
                onClick={handleSubmit}
                disabled={createWebsite.isPending || updateWebsite.isPending}
              >
                {editingWebsite ? "Actualizar" : "Crear Sitio"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Website Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <IconWorld className="h-5 w-5" />
            <span>Sitios Configurados</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {websites && websites.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sitio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Frecuencia</TableHead>
                  <TableHead>Estadísticas</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {websites.map((website) => (
                  <TableRow key={website.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{website.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {website.baseUrl}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={website.isActive ? "default" : "secondary"}
                      >
                        {website.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm">
                        <IconClock className="h-3 w-3" />
                        <span>
                          {website.extractionFrequency}m /{" "}
                          {website.generationFrequency}m
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div>
                          {website.statistics?.totalUrlsExtracted || 0} URLs
                          extraídas
                        </div>
                        <div className="text-muted-foreground">
                          {website.statistics?.successfulExtractions || 0}{" "}
                          exitosas
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 flex-wrap gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(website)}
                          title="Editar configuración"
                        >
                          <IconEdit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManualExtractUrls(website.id)}
                          title="Extraer URLs manualmente"
                          className="bg-blue-50 hover:bg-blue-100"
                        >
                          <IconWorld className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            /* TODO: Delete functionality */
                          }}
                          title="Eliminar sitio"
                        >
                          <IconTrash className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <IconWorld className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No hay sitios configurados
              </h3>
              <p className="text-muted-foreground">
                Agrega tu primer sitio web para comenzar a extraer noticias
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results Dialog */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resultados de Prueba de Selectores</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Listing Test Results */}
            {listingTestResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconWorld className="h-5 w-5" />
                    Prueba de Listado de URLs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">
                        {listingTestResult.totalUrls}
                      </div>
                      <p className="text-sm text-muted-foreground">URLs encontradas</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Badge variant={listingTestResult.success ? "default" : "destructive"}>
                        {listingTestResult.success ? "Exitoso" : "Falló"}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-2">
                        Tiempo: {listingTestResult.processingTime}ms
                      </p>
                    </div>
                  </div>

                  {listingTestResult.extractedUrls.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">URLs extraídas (muestra):</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {listingTestResult.extractedUrls.slice(0, 10).map((urlData, idx) => (
                          <div key={idx} className="p-2 border rounded text-xs">
                            <div className="font-medium text-blue-600 truncate">{urlData.url}</div>
                            {urlData.title && <div className="text-muted-foreground">Título: {urlData.title}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {listingTestResult.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm mt-4">
                      <strong>Error:</strong> {listingTestResult.error}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Content Test Results */}
            {contentTestResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconEdit className="h-5 w-5" />
                    Prueba de Contenido Individual
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-4 border rounded-lg">
                      <Badge variant={contentTestResult.success ? "default" : "destructive"}>
                        {contentTestResult.success ? "Exitoso" : "Falló"}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-2">
                        Tiempo: {contentTestResult.processingTime}ms
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {contentTestResult.extractedContent.content?.length || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">Caracteres extraídos</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-sm font-medium text-muted-foreground">
                      URL: {contentTestResult.extractedContent.url}
                    </div>

                    {contentTestResult.extractedContent.title && (
                      <div>
                        <h4 className="font-medium mb-2">Título extraído:</h4>
                        <div className="p-3 bg-gray-50 border rounded text-sm">
                          {contentTestResult.extractedContent.title}
                        </div>
                      </div>
                    )}

                    {contentTestResult.extractedContent.content && (
                      <div>
                        <h4 className="font-medium mb-2">Contenido extraído:</h4>
                        <div className="p-3 bg-gray-50 border rounded text-sm max-h-32 overflow-y-auto">
                          {contentTestResult.extractedContent.content.substring(0, 500)}
                          {contentTestResult.extractedContent.content.length > 500 && '...'}
                        </div>
                      </div>
                    )}

                    {contentTestResult.extractedContent.images && contentTestResult.extractedContent.images.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Imágenes encontradas:</h4>
                        <div className="space-y-1">
                          {contentTestResult.extractedContent.images.slice(0, 3).map((img, idx) => (
                            <div key={idx} className="text-xs text-blue-600 truncate">{img}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(contentTestResult.extractedContent.author || contentTestResult.extractedContent.category) && (
                      <div className="grid grid-cols-2 gap-4">
                        {contentTestResult.extractedContent.author && (
                          <div>
                            <span className="font-medium text-sm">Autor: </span>
                            <span className="text-sm">{contentTestResult.extractedContent.author}</span>
                          </div>
                        )}
                        {contentTestResult.extractedContent.category && (
                          <div>
                            <span className="font-medium text-sm">Categoría: </span>
                            <span className="text-sm">{contentTestResult.extractedContent.category}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {contentTestResult.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm mt-4">
                      <strong>Error:</strong> {contentTestResult.error}
                    </div>
                  )}

                  {contentTestResult.details && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-sm mt-4">
                      <strong>Detalles:</strong> {contentTestResult.details}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Legacy Test Results */}
            {testResult && !listingTestResult && !contentTestResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Prueba Completa de Selectores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Extracción de URLs</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {testResult.testResult?.listingTest?.urlsFound || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">URLs encontradas</p>
                        {testResult.testResult?.listingTest?.sampleUrls?.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs font-medium">URLs de muestra:</p>
                            {testResult.testResult.listingTest.sampleUrls
                              .slice(0, 3)
                              .map((url: string, idx: number) => (
                                <p key={idx} className="text-xs text-muted-foreground truncate">
                                  {url}
                                </p>
                              ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Extracción de Contenido</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge
                          variant={
                            testResult.testResult?.contentTest?.success ? "default" : "destructive"
                          }
                        >
                          {testResult.testResult?.contentTest?.success ? "Exitoso" : "Falló"}
                        </Badge>
                        {testResult.testResult?.contentTest?.extractedData && (
                          <div className="mt-2 space-y-1 text-xs">
                            {testResult.testResult.contentTest.extractedData.title && (
                              <p>
                                <strong>Título:</strong>{" "}
                                {testResult.testResult.contentTest.extractedData.title.substring(0, 50)}...
                              </p>
                            )}
                            {testResult.testResult.contentTest.extractedData.content && (
                              <p>
                                <strong>Contenido:</strong>{" "}
                                {testResult.testResult.contentTest.extractedData.content.substring(0, 100)}...
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {testResult.testResult?.performance && (
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle className="text-sm">Performance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="font-semibold">
                              {testResult.testResult.performance.listingTime}ms
                            </div>
                            <div className="text-muted-foreground">Tiempo de listado</div>
                          </div>
                          <div>
                            <div className="font-semibold">
                              {testResult.testResult.performance.contentTime}ms
                            </div>
                            <div className="text-muted-foreground">Tiempo de contenido</div>
                          </div>
                          <div>
                            <div className="font-semibold">
                              {testResult.testResult.performance.totalTime}ms
                            </div>
                            <div className="text-muted-foreground">Tiempo total</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => {
              setIsTestDialogOpen(false);
              setTestResult(null);
              setListingTestResult(null);
              setContentTestResult(null);
            }}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Workflow Dialog */}
      <Dialog open={isWorkflowDialogOpen} onOpenChange={setIsWorkflowDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Flujo de Trabajo Manual</DialogTitle>
            <DialogDescription>
              Extrae URLs, contenido y genera contenido paso a paso
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Step 1: Extract URLs */}
            {currentWorkflowStep === 'extractUrls' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconWorld className="h-5 w-5" />
                    Extrayendo URLs...
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">
                      Extrayendo URLs del sitio web...
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Select Content */}
            {currentWorkflowStep === 'selectContent' && extractedUrls.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconWorld className="h-5 w-5" />
                    URLs Extraídas ({extractedUrls.length})
                  </CardTitle>
                  <CardDescription>
                    Selecciona las URLs de las cuales extraer contenido
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {extractedUrls.map((url, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`url-${index}`}
                          checked={selectedUrls.includes(url)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUrls([...selectedUrls, url]);
                            } else {
                              setSelectedUrls(selectedUrls.filter(u => u !== url));
                            }
                          }}
                          className="rounded"
                        />
                        <label
                          htmlFor={`url-${index}`}
                          className="text-sm text-blue-600 hover:underline cursor-pointer flex-1"
                        >
                          {url}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (selectedUrls.length === extractedUrls.length) {
                          setSelectedUrls([]);
                        } else {
                          setSelectedUrls([...extractedUrls]);
                        }
                      }}
                    >
                      {selectedUrls.length === extractedUrls.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                    </Button>
                    <Button
                      onClick={() => handleSelectUrls(selectedUrls)}
                      disabled={selectedUrls.length === 0}
                    >
                      Extraer Contenido ({selectedUrls.length})
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsWorkflowDialogOpen(false);
                setCurrentWorkflowStep('extractUrls');
                setExtractedUrls([]);
                setSelectedUrls([]);
                setCurrentWebsiteId('');
              }}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
