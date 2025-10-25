# Backend API Implementation Guide
## Outlet Detail Statistics & History Endpoints

### Overview
This document provides the exact implementation needed in the NestJS backend to support the redesigned outlet detail screen.

## Database Changes

### 1. Create extraction_runs Table

```sql
CREATE TABLE extraction_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_config_id UUID NOT NULL REFERENCES websiteconfig(id) ON DELETE CASCADE,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration INT, -- duration in seconds
  total_urls_found INT DEFAULT 0,
  total_content_extracted INT DEFAULT 0,
  total_failed INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'in_progress', -- 'in_progress' | 'completed' | 'failed' | 'partial'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_extraction_runs_website ON extraction_runs(website_config_id, started_at DESC);
CREATE INDEX idx_extraction_runs_status ON extraction_runs(status);
```

### 2. Create Entity

**File**: `src/generator-pro/entities/extraction-run.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WebsiteConfig } from './website-config.entity';

@Entity('extraction_runs')
export class ExtractionRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'website_config_id' })
  websiteConfigId: string;

  @ManyToOne(() => WebsiteConfig, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'website_config_id' })
  websiteConfig: WebsiteConfig;

  @Column({ name: 'started_at', type: 'timestamp' })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'int', nullable: true })
  duration: number | null; // seconds

  @Column({ name: 'total_urls_found', type: 'int', default: 0 })
  totalUrlsFound: number;

  @Column({ name: 'total_content_extracted', type: 'int', default: 0 })
  totalContentExtracted: number;

  @Column({ name: 'total_failed', type: 'int', default: 0 })
  totalFailed: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'in_progress',
  })
  status: 'in_progress' | 'completed' | 'failed' | 'partial';

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

## Controller Implementation

**File**: `src/generator-pro/controllers/generator-pro.controller.ts`

Add these new endpoints:

```typescript
import { Controller, Get, Param, Query } from '@nestjs/common';
import { GeneratorProService } from '../services/generator-pro.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Generator Pro')
@Controller('generator-pro')
export class GeneratorProController {
  constructor(private readonly generatorProService: GeneratorProService) {}

  /**
   * Get real statistics for an outlet from extractednoticias table
   */
  @Get('websites/:id/statistics')
  @ApiOperation({ summary: 'Get real statistics for outlet' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getOutletStatistics(@Param('id') id: string) {
    return this.generatorProService.getOutletStatistics(id);
  }

  /**
   * Get extraction history for an outlet
   */
  @Get('websites/:id/extraction-history')
  @ApiOperation({ summary: 'Get extraction history for outlet' })
  @ApiResponse({ status: 200, description: 'History retrieved successfully' })
  async getExtractionHistory(
    @Param('id') id: string,
    @Query('limit') limit: number = 5,
  ) {
    return this.generatorProService.getExtractionHistory(id, limit);
  }
}
```

## Service Implementation

**File**: `src/generator-pro/services/generator-pro.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExtractedNoticia } from '../entities/extracted-noticia.entity';
import { ExtractionRun } from '../entities/extraction-run.entity';

@Injectable()
export class GeneratorProService {
  constructor(
    @InjectRepository(ExtractedNoticia)
    private readonly extractedNoticiaRepo: Repository<ExtractedNoticia>,
    @InjectRepository(ExtractionRun)
    private readonly extractionRunRepo: Repository<ExtractionRun>,
  ) {}

  /**
   * Get real statistics from extractednoticias table
   */
  async getOutletStatistics(websiteConfigId: string) {
    // Get counts using raw SQL for performance
    const result = await this.extractedNoticiaRepo
      .createQueryBuilder('en')
      .select([
        'COUNT(*) as total_urls_extracted',
        "COUNT(CASE WHEN en.status = 'extracted' THEN 1 END) as total_content_extracted",
        "COUNT(CASE WHEN en.status = 'failed' THEN 1 END) as total_failed",
      ])
      .where('en.websiteConfigId = :websiteConfigId', { websiteConfigId })
      .getRawOne();

    const totalUrlsExtracted = parseInt(result.total_urls_extracted) || 0;
    const totalContentExtracted = parseInt(result.total_content_extracted) || 0;
    const totalFailed = parseInt(result.total_failed) || 0;

    // Calculate success rate
    const successRate = totalUrlsExtracted > 0
      ? (totalContentExtracted / totalUrlsExtracted) * 100
      : 0;

    return {
      totalUrlsExtracted,
      totalContentExtracted,
      totalFailed,
      successRate: parseFloat(successRate.toFixed(2)),
    };
  }

  /**
   * Get extraction history
   */
  async getExtractionHistory(websiteConfigId: string, limit: number = 5) {
    const history = await this.extractionRunRepo.find({
      where: { websiteConfigId },
      order: { startedAt: 'DESC' },
      take: limit,
    });

    const total = await this.extractionRunRepo.count({
      where: { websiteConfigId },
    });

    return {
      history,
      total,
    };
  }

  /**
   * Create extraction run (call this at the START of extraction)
   */
  async createExtractionRun(websiteConfigId: string): Promise<ExtractionRun> {
    const run = this.extractionRunRepo.create({
      websiteConfigId,
      startedAt: new Date(),
      status: 'in_progress',
    });

    return this.extractionRunRepo.save(run);
  }

  /**
   * Update extraction run (call this at the END of extraction)
   */
  async updateExtractionRun(
    runId: string,
    data: {
      completedAt: Date;
      duration: number; // seconds
      totalUrlsFound: number;
      totalContentExtracted: number;
      totalFailed: number;
      status: 'completed' | 'failed' | 'partial';
      errorMessage?: string;
    },
  ): Promise<ExtractionRun> {
    await this.extractionRunRepo.update(runId, data);
    return this.extractionRunRepo.findOne({ where: { id: runId } });
  }
}
```

## Update Extraction Process

**Modify your extraction logic to track runs:**

```typescript
// In your extract-all or similar method
async extractAll(websiteConfigId: string) {
  // 1. Create extraction run
  const startTime = Date.now();
  const run = await this.generatorProService.createExtractionRun(websiteConfigId);

  let totalUrlsFound = 0;
  let totalContentExtracted = 0;
  let totalFailed = 0;
  let status: 'completed' | 'failed' | 'partial' = 'completed';
  let errorMessage: string | null = null;

  try {
    // 2. Extract URLs
    const urls = await this.extractUrls(websiteConfigId);
    totalUrlsFound = urls.length;

    // 3. Extract content for each URL
    for (const url of urls) {
      try {
        await this.extractContent(url, websiteConfigId);
        totalContentExtracted++;
      } catch (error) {
        totalFailed++;
        console.error(`Failed to extract content from ${url}:`, error);
      }
    }

    // 4. Determine final status
    if (totalFailed === 0) {
      status = 'completed';
    } else if (totalContentExtracted > 0) {
      status = 'partial';
    } else {
      status = 'failed';
      errorMessage = 'All extractions failed';
    }
  } catch (error) {
    status = 'failed';
    errorMessage = error.message;
    console.error('Extraction failed:', error);
  } finally {
    // 5. Update extraction run with results
    const endTime = Date.now();
    const duration = Math.floor((endTime - startTime) / 1000); // Convert to seconds

    await this.generatorProService.updateExtractionRun(run.id, {
      completedAt: new Date(),
      duration,
      totalUrlsFound,
      totalContentExtracted,
      totalFailed,
      status,
      errorMessage,
    });
  }

  return {
    runId: run.id,
    totalUrlsFound,
    totalContentExtracted,
    totalFailed,
    duration: Math.floor((Date.now() - startTime) / 1000),
    status,
  };
}
```

## Module Configuration

**File**: `src/generator-pro/generator-pro.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneratorProController } from './controllers/generator-pro.controller';
import { GeneratorProService } from './services/generator-pro.service';
import { ExtractedNoticia } from './entities/extracted-noticia.entity';
import { ExtractionRun } from './entities/extraction-run.entity';
import { WebsiteConfig } from './entities/website-config.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExtractedNoticia,
      ExtractionRun,
      WebsiteConfig,
    ]),
  ],
  controllers: [GeneratorProController],
  providers: [GeneratorProService],
  exports: [GeneratorProService],
})
export class GeneratorProModule {}
```

## Testing the Endpoints

### 1. Test Statistics Endpoint

```bash
curl -X GET http://localhost:3000/api/generator-pro/websites/YOUR-WEBSITE-ID/statistics
```

**Expected Response**:
```json
{
  "totalUrlsExtracted": 1250,
  "totalContentExtracted": 1180,
  "totalFailed": 70,
  "successRate": 94.4
}
```

### 2. Test History Endpoint

```bash
curl -X GET "http://localhost:3000/api/generator-pro/websites/YOUR-WEBSITE-ID/extraction-history?limit=5"
```

**Expected Response**:
```json
{
  "history": [
    {
      "id": "uuid-1",
      "websiteConfigId": "uuid-website",
      "startedAt": "2025-10-09T10:30:00.000Z",
      "completedAt": "2025-10-09T10:35:00.000Z",
      "duration": 300,
      "totalUrlsFound": 50,
      "totalContentExtracted": 45,
      "totalFailed": 5,
      "status": "completed",
      "errorMessage": null,
      "createdAt": "2025-10-09T10:30:00.000Z",
      "updatedAt": "2025-10-09T10:35:00.000Z"
    }
  ],
  "total": 25
}
```

## Migration File

Create a TypeORM migration:

```bash
npm run migration:create src/migrations/CreateExtractionRunsTable
```

**File**: `src/migrations/TIMESTAMP-CreateExtractionRunsTable.ts`

```typescript
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateExtractionRunsTable1696800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'extraction_runs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'website_config_id',
            type: 'uuid',
          },
          {
            name: 'started_at',
            type: 'timestamp',
            default: 'NOW()',
          },
          {
            name: 'completed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'duration',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'total_urls_found',
            type: 'int',
            default: 0,
          },
          {
            name: 'total_content_extracted',
            type: 'int',
            default: 0,
          },
          {
            name: 'total_failed',
            type: 'int',
            default: 0,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'in_progress'",
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'NOW()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'NOW()',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['website_config_id'],
            referencedTableName: 'websiteconfig',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'extraction_runs',
      new TableIndex({
        name: 'idx_extraction_runs_website',
        columnNames: ['website_config_id', 'started_at'],
      }),
    );

    await queryRunner.createIndex(
      'extraction_runs',
      new TableIndex({
        name: 'idx_extraction_runs_status',
        columnNames: ['status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('extraction_runs', 'idx_extraction_runs_status');
    await queryRunner.dropIndex('extraction_runs', 'idx_extraction_runs_website');
    await queryRunner.dropTable('extraction_runs');
  }
}
```

## Implementation Checklist

### Database
- [ ] Create extraction_runs table
- [ ] Create indexes
- [ ] Run migration
- [ ] Verify table structure

### Entities
- [ ] Create ExtractionRun entity
- [ ] Add relationships to WebsiteConfig
- [ ] Verify column mappings

### Service
- [ ] Implement getOutletStatistics()
- [ ] Implement getExtractionHistory()
- [ ] Implement createExtractionRun()
- [ ] Implement updateExtractionRun()
- [ ] Add ExtractionRun repository injection

### Controller
- [ ] Add statistics endpoint
- [ ] Add history endpoint
- [ ] Add Swagger documentation
- [ ] Test endpoints

### Extraction Process
- [ ] Call createExtractionRun() at start
- [ ] Track metrics during extraction
- [ ] Call updateExtractionRun() at end
- [ ] Handle errors properly

### Testing
- [ ] Test statistics endpoint
- [ ] Test history endpoint
- [ ] Test extraction run creation
- [ ] Test extraction run updates
- [ ] Verify data accuracy

---

**Updated**: 2025-10-09
**Implementation Priority**: HIGH
**Estimated Time**: 2-3 hours
