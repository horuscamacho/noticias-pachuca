import { Injectable } from '@nestjs/common';
import { Model, Document, PopulateOptions } from 'mongoose';
import { IPaginationParams, calculateSkip } from '../dto/pagination.dto';
import { PaginatedResponse } from '../interfaces/paginated-response.interface';

interface PaginationOptions {
  sort?: Record<string, 1 | -1>;
  select?: string;
  populate?: string | PopulateOptions | (string | PopulateOptions)[];
}

@Injectable()
export class PaginationService {
  async paginate<T extends Document>(
    model: Model<T>,
    paginationDto: IPaginationParams,
    filter: Record<string, unknown> = {},
    options: PaginationOptions = {},
  ): Promise<PaginatedResponse<T>> {
    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 10;
    const skip = calculateSkip(page, limit);

    // Count total documents that match the filter
    const total = await model.countDocuments(filter);

    // Build the query
    let query = model
      .find(filter)
      .sort(options.sort || { createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Apply select if provided
    if (options.select) {
      query = query.select(options.select);
    }

    // Apply populate if provided
    if (options.populate) {
      query = query.populate(options.populate as PopulateOptions | (string | PopulateOptions)[]);
    }

    // Execute the query
    const data = await query.exec();

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    };
  }
}
