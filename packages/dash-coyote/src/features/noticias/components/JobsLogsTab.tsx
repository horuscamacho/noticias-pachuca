/**
 * 📋 JobsLogsTab Component
 * Display jobs status and extraction statistics
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Activity,
  BarChart3,
  RefreshCw,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { useNoticiasJobs, useExtractionStats, useRetryJob } from '../hooks';

export function JobsLogsTab() {
  const [page, setPage] = useState(1);

  const { data: jobsData, isLoading, refetch } = useNoticiasJobs({ page, limit: 20 });
  const { data: stats } = useExtractionStats();
  const retryMutation = useRetryJob();

  const handleRetry = async (jobId: string) => {
    try {
      await retryMutation.mutateAsync(jobId);
      toast.success('Job reenviado a la cola');
    } catch (error) {
      toast.error('Error al reintentar job');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'processing':
        return 'default';
      case 'pending':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Total Extracciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Tasa éxito: {stats.performance.successRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                Exitosas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.successful}</div>
              <p className="text-xs text-muted-foreground">
                Tiempo promedio: {stats.performance.averageProcessingTime}ms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Activity className="h-4 w-4 mr-2 text-blue-500" />
                En Proceso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
              <p className="text-xs text-muted-foreground">
                Pendientes: {stats.pending}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <XCircle className="h-4 w-4 mr-2 text-red-500" />
                Fallidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <p className="text-xs text-muted-foreground">
                Diarias: {stats.performance.dailyExtractions}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Jobs de Extracción</span>
            </CardTitle>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
          <p className="text-muted-foreground">
            {jobsData?.pagination?.total || 0} jobs en el sistema
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Cargando jobs...</p>
            </div>
          ) : !jobsData?.data || jobsData.data.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No hay jobs disponibles</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job ID</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Dominio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Progreso</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobsData?.data.map((job) => (
                  <TableRow key={job._id}>
                    <TableCell className="font-mono text-xs">
                      {job.jobId.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={job.sourceUrl}>
                        {job.sourceUrl}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{job.domain}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(job.status)}
                        <Badge variant={getStatusColor(job.status)}>
                          {job.status === 'completed'
                            ? 'Completado'
                            : job.status === 'failed'
                            ? 'Fallido'
                            : job.status === 'processing'
                            ? 'Procesando'
                            : 'Pendiente'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-16">
                        <Progress value={job.progress} className="h-2" />
                        <span className="text-xs text-muted-foreground">
                          {job.progress}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {format(new Date(job.createdAt), 'dd/MM HH:mm', { locale: es })}
                    </TableCell>
                    <TableCell>
                      {job.status === 'failed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRetry(job.jobId)}
                          disabled={retryMutation.isPending}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Domain Performance */}
      {stats?.byDomain && stats.byDomain.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento por Dominio</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dominio</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Exitosas</TableHead>
                  <TableHead>Fallidas</TableHead>
                  <TableHead>Tasa Éxito</TableHead>
                  <TableHead>Última Extracción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.byDomain.map((domain) => (
                  <TableRow key={domain.domain}>
                    <TableCell>
                      <Badge variant="outline">{domain.domain}</Badge>
                    </TableCell>
                    <TableCell>{domain.total}</TableCell>
                    <TableCell className="text-green-600">{domain.successful}</TableCell>
                    <TableCell className="text-red-600">{domain.failed}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Progress
                          value={(domain.successful / domain.total) * 100}
                          className="h-2 w-16"
                        />
                        <span className="text-sm">
                          {((domain.successful / domain.total) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {domain.lastExtraction
                        ? format(new Date(domain.lastExtraction), 'dd/MM/yyyy', {
                            locale: es,
                          })
                        : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}