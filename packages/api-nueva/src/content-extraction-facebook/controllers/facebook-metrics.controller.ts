import {
  Controller,
  Get,
  Query,
  HttpStatus,
  UseGuards,
  Logger
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery
} from '@nestjs/swagger';

import { FacebookMetricsService } from '../services/facebook-metrics.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';

import {
  FacebookMetricsQueryDto,
  FacebookUsageStatsDto,
  FacebookPageStatsDto,
  FacebookErrorAnalysisDto,
  FacebookPerformanceDto
} from '../dto/facebook-metrics.dto';

interface UsageStatsSummary {
  totalCalls: number;
  successfulCalls: number;
  errorCalls: number;
  successRate: number;
  avgResponseTime: number;
  peakUsageHour: number;
  dailyLimit: number;
  remainingCalls: number;
}

interface PageStats {
  pageId: string;
  pageName: string;
  totalCalls: number;
  errors: number;
  successRate: number;
  avgResponseTime: number;
  lastExtraction: Date;
  totalExtractions: number;
}

interface Recommendation {
  type: 'warning' | 'error' | 'optimization' | 'info';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  action: string;
  impact: string;
}

@ApiTags('Facebook API Metrics & Analytics')
@Controller('content-extraction-facebook/metrics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class FacebookMetricsController {
  private readonly logger = new Logger(FacebookMetricsController.name);

  constructor(
    private readonly metricsService: FacebookMetricsService
  ) {}

  /**
   * 📊 OBTENER MÉTRICAS GENERALES DE USO
   */
  @Get('usage')
  @ApiOperation({
    summary: 'Get Facebook API usage metrics',
    description: 'Retrieve comprehensive usage statistics for Facebook API calls'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usage metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalCalls: { type: 'number', example: 850 },
        successfulCalls: { type: 'number', example: 823 },
        errorCalls: { type: 'number', example: 27 },
        successRate: { type: 'number', example: 96.8 },
        avgResponseTime: { type: 'number', example: 1250 },
        peakUsageHour: { type: 'number', example: 14 },
        dailyLimit: { type: 'number', example: 200 },
        remainingCalls: { type: 'number', example: 125 }
      }
    }
  })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO)' })
  @ApiQuery({ name: 'period', required: false, enum: ['hourly', 'daily', 'weekly', 'monthly'] })
  @ApiQuery({ name: 'pageId', required: false, type: String, description: 'Filter by page ID' })
  async getUsageMetrics(@Query() query: FacebookMetricsQueryDto): Promise<UsageStatsSummary> {
    this.logger.log(`Getting usage metrics: ${JSON.stringify(query)}`);
    return await this.metricsService.getUsageMetrics(query);
  }

  /**
   * 📈 OBTENER ESTADÍSTICAS POR PÁGINA
   */
  @Get('pages')
  @ApiOperation({
    summary: 'Get page-specific API usage statistics',
    description: 'Retrieve API usage statistics grouped by Facebook page'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Page statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pageId: { type: 'string', example: '123456789' },
              pageName: { type: 'string', example: 'Pachuca Noticias' },
              totalCalls: { type: 'number', example: 125 },
              errors: { type: 'number', example: 3 },
              successRate: { type: 'number', example: 97.6 },
              avgResponseTime: { type: 'number', example: 1150 },
              lastExtraction: { type: 'string', format: 'date-time' },
              totalExtractions: { type: 'number', example: 42 }
            }
          }
        },
        pagination: { type: 'object' }
      }
    }
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date filter' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date filter' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filter by page category' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by page name' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['totalCalls', 'errors', 'avgResponseTime', 'successRate'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async getPageStats(@Query() query: FacebookPageStatsDto): Promise<PaginatedResponse<PageStats>> {
    this.logger.log(`Getting page statistics: ${JSON.stringify(query)}`);
    return await this.metricsService.getPageStats(query);
  }

  /**
   * 🚨 ANÁLISIS DE ERRORES
   */
  @Get('errors')
  @ApiOperation({
    summary: 'Get Facebook API error analysis',
    description: 'Analyze API errors with breakdown by type and timeline'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Error analysis retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        summary: {
          type: 'object',
          properties: {
            totalErrors: { type: 'number', example: 27 },
            errorRate: { type: 'number', example: 3.2 },
            mostCommonError: { type: 'string', example: 'rate_limit' }
          }
        },
        breakdown: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              errorType: { type: 'string', example: 'rate_limit' },
              count: { type: 'number', example: 15 },
              percentage: { type: 'number', example: 55.6 },
              trend: { type: 'string', enum: ['increasing', 'decreasing', 'stable'] }
            }
          }
        },
        timeline: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string', example: '2025-01-15' },
              errors: { type: 'number', example: 5 }
            }
          }
        }
      }
    }
  })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date filter' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date filter' })
  @ApiQuery({ name: 'errorType', required: false, enum: ['rate_limit', 'auth_error', 'timeout', 'invalid_request', 'server_error'] })
  @ApiQuery({ name: 'minErrorCount', required: false, type: Number, description: 'Minimum error count' })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['hour', 'day', 'week'] })
  async getErrorAnalysis(@Query() query: FacebookErrorAnalysisDto): Promise<{
    summary: {
      totalErrors: number;
      errorRate: number;
      mostCommonError: string;
    };
    breakdown: Array<{
      errorType: string;
      count: number;
      percentage: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    }>;
    timeline: Array<{ date: string; errors: number }>;
  }> {
    this.logger.log(`Getting error analysis: ${JSON.stringify(query)}`);
    return await this.metricsService.getErrorAnalysis(query);
  }

  /**
   * ⚡ ANÁLISIS DE RENDIMIENTO
   */
  @Get('performance')
  @ApiOperation({
    summary: 'Get Facebook API performance analysis',
    description: 'Analyze API performance including response times and throughput'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Performance analysis retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        responseTimes: {
          type: 'object',
          properties: {
            average: { type: 'number', example: 1250 },
            median: { type: 'number', example: 1100 },
            p95: { type: 'number', example: 2500 },
            p99: { type: 'number', example: 4200 }
          }
        },
        throughput: {
          type: 'object',
          properties: {
            callsPerHour: { type: 'number', example: 25 },
            peakHour: { type: 'number', example: 14 },
            quietHour: { type: 'number', example: 3 }
          }
        },
        trends: {
          type: 'object',
          properties: {
            responseTimeTrend: { type: 'string', enum: ['improving', 'degrading', 'stable'] },
            throughputTrend: { type: 'string', enum: ['increasing', 'decreasing', 'stable'] }
          }
        }
      }
    }
  })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date filter' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date filter' })
  @ApiQuery({ name: 'includePercentiles', required: false, type: Boolean, description: 'Include percentile analysis' })
  @ApiQuery({ name: 'includeTrends', required: false, type: Boolean, description: 'Include trend analysis' })
  @ApiQuery({ name: 'metric', required: false, enum: ['response_time', 'success_rate', 'throughput', 'error_rate'] })
  async getPerformanceAnalysis(@Query() query: FacebookPerformanceDto): Promise<{
    responseTimes: {
      average: number;
      median: number;
      p95: number;
      p99: number;
    };
    throughput: {
      callsPerHour: number;
      peakHour: number;
      quietHour: number;
    };
    trends: {
      responseTimeTrend: 'improving' | 'degrading' | 'stable';
      throughputTrend: 'increasing' | 'decreasing' | 'stable';
    };
  }> {
    this.logger.log(`Getting performance analysis: ${JSON.stringify(query)}`);
    return await this.metricsService.getPerformanceAnalysis(query);
  }

  /**
   * 📊 DASHBOARD GENERAL
   */
  @Get('dashboard')
  @ApiOperation({
    summary: 'Get comprehensive metrics dashboard',
    description: 'Get combined metrics data for dashboard display'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        usage: {
          type: 'object',
          properties: {
            totalCalls: { type: 'number', example: 850 },
            successRate: { type: 'number', example: 96.8 },
            remainingCalls: { type: 'number', example: 125 },
            peakUsageHour: { type: 'number', example: 14 }
          }
        },
        performance: {
          type: 'object',
          properties: {
            avgResponseTime: { type: 'number', example: 1250 },
            callsPerHour: { type: 'number', example: 25 },
            responseTimeTrend: { type: 'string', example: 'stable' }
          }
        },
        errors: {
          type: 'object',
          properties: {
            totalErrors: { type: 'number', example: 27 },
            errorRate: { type: 'number', example: 3.2 },
            mostCommonError: { type: 'string', example: 'rate_limit' }
          }
        },
        topPages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pageId: { type: 'string', example: '123456789' },
              pageName: { type: 'string', example: 'Pachuca Noticias' },
              calls: { type: 'number', example: 125 },
              successRate: { type: 'number', example: 97.6 }
            }
          }
        }
      }
    }
  })
  @ApiQuery({ name: 'period', required: false, enum: ['today', 'week', 'month'], description: 'Time period for dashboard' })
  async getDashboardMetrics(@Query('period') period?: 'today' | 'week' | 'month'): Promise<{
    usage: {
      totalCalls: number;
      successRate: number;
      remainingCalls: number;
      peakUsageHour: number;
    };
    performance: {
      avgResponseTime: number;
      callsPerHour: number;
      responseTimeTrend: string;
    };
    errors: {
      totalErrors: number;
      errorRate: number;
      mostCommonError: string;
    };
    topPages: Array<{
      pageId: string;
      pageName: string;
      calls: number;
      successRate: number;
    }>;
  }> {
    this.logger.log(`Getting dashboard metrics for period: ${period || 'week'}`);

    // Configurar fechas según el período
    const endDate = new Date();
    let startDate = new Date();

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default: // week
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
    }

    // Obtener datos en paralelo
    const [usageMetrics, performanceMetrics, errorAnalysis, pageStats] = await Promise.all([
      this.metricsService.getUsageMetrics({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }),
      this.metricsService.getPerformanceAnalysis({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }),
      this.metricsService.getErrorAnalysis({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }),
      (() => {
        const dto = new FacebookPageStatsDto();
        dto.startDate = startDate.toISOString();
        dto.endDate = endDate.toISOString();
        dto.page = 1;
        dto.limit = 5;
        dto.sortBy = 'totalCalls';
        dto.sortOrder = 'desc';
        return this.metricsService.getPageStats(dto);
      })()
    ]);

    return {
      usage: {
        totalCalls: usageMetrics.totalCalls,
        successRate: usageMetrics.successRate,
        remainingCalls: usageMetrics.remainingCalls,
        peakUsageHour: usageMetrics.peakUsageHour
      },
      performance: {
        avgResponseTime: performanceMetrics.responseTimes.average,
        callsPerHour: performanceMetrics.throughput.callsPerHour,
        responseTimeTrend: performanceMetrics.trends.responseTimeTrend
      },
      errors: {
        totalErrors: errorAnalysis.summary.totalErrors,
        errorRate: errorAnalysis.summary.errorRate,
        mostCommonError: errorAnalysis.summary.mostCommonError
      },
      topPages: pageStats.data.map(page => ({
        pageId: page.pageId,
        pageName: page.pageName,
        calls: page.totalCalls,
        successRate: page.successRate
      }))
    };
  }

  /**
   * 💡 OBTENER RECOMENDACIONES
   */
  @Get('recommendations')
  @ApiOperation({
    summary: 'Get API usage recommendations',
    description: 'Get intelligent recommendations for optimizing Facebook API usage'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recommendations retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['optimization', 'warning', 'error', 'info'] },
              priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              title: { type: 'string', example: 'Optimize extraction frequency' },
              description: { type: 'string', example: 'Consider reducing extraction frequency for low-engagement pages' },
              action: { type: 'string', example: 'Review page settings' },
              impact: { type: 'string', example: 'Could save 15-20% of API calls' }
            }
          }
        },
        summary: {
          type: 'object',
          properties: {
            totalRecommendations: { type: 'number', example: 5 },
            highPriority: { type: 'number', example: 2 },
            potentialSavings: { type: 'string', example: '25% API calls' }
          }
        }
      }
    }
  })
  async getRecommendations(): Promise<{
    recommendations: Array<{
      type: 'optimization' | 'warning' | 'error' | 'info';
      priority: 'low' | 'medium' | 'high' | 'critical';
      title: string;
      description: string;
      action: string;
      impact: string;
    }>;
    summary: {
      totalRecommendations: number;
      highPriority: number;
      potentialSavings: string;
    };
  }> {
    this.logger.log('Getting API usage recommendations');

    // Obtener métricas recientes para generar recomendaciones
    const usageMetrics = await this.metricsService.getUsageMetrics({});
    const errorAnalysis = await this.metricsService.getErrorAnalysis({});

    const recommendations: Recommendation[] = [];

    // Generar recomendaciones basadas en métricas
    if (usageMetrics.successRate < 95) {
      recommendations.push({
        type: 'warning' as const,
        priority: 'high' as const,
        title: 'Low Success Rate Detected',
        description: `Current success rate is ${usageMetrics.successRate.toFixed(1)}%. Consider reviewing API calls.`,
        action: 'Check error logs and optimize requests',
        impact: 'Improved reliability and data quality'
      });
    }

    if (usageMetrics.remainingCalls < 50) {
      recommendations.push({
        type: 'error' as const,
        priority: 'critical' as const,
        title: 'API Limit Nearly Reached',
        description: `Only ${usageMetrics.remainingCalls} calls remaining today.`,
        action: 'Reduce extraction frequency or optimize requests',
        impact: 'Prevent API limit violations'
      });
    }

    if (usageMetrics.avgResponseTime > 2000) {
      recommendations.push({
        type: 'optimization' as const,
        priority: 'medium' as const,
        title: 'High Response Times',
        description: `Average response time is ${usageMetrics.avgResponseTime}ms.`,
        action: 'Optimize request batching and timing',
        impact: 'Faster extractions and better user experience'
      });
    }

    if (errorAnalysis.summary.errorRate > 5) {
      recommendations.push({
        type: 'warning' as const,
        priority: 'high' as const,
        title: 'High Error Rate',
        description: `Error rate is ${errorAnalysis.summary.errorRate.toFixed(1)}%.`,
        action: 'Review and fix common error causes',
        impact: 'Reduced failed extractions'
      });
    }

    // Siempre incluir recomendación informativa
    recommendations.push({
      type: 'info' as const,
      priority: 'low' as const,
      title: 'Regular Monitoring',
      description: 'Continue monitoring API usage patterns for optimization opportunities.',
      action: 'Review metrics weekly',
      impact: 'Maintain optimal performance'
    });

    const highPriorityCount = recommendations.filter(r => r.priority === 'high' || r.priority === 'critical').length;

    return {
      recommendations,
      summary: {
        totalRecommendations: recommendations.length,
        highPriority: highPriorityCount,
        potentialSavings: highPriorityCount > 0 ? '15-30% API calls' : '5-10% API calls'
      }
    };
  }
}