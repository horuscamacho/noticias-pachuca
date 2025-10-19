import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * 🔄 Transform JSON Arrays Interceptor
 *
 * Transforma strings JSON a arrays en el body de multipart/form-data
 *
 * Cuando el frontend envía arrays usando FormData.append('field', JSON.stringify(array)),
 * este interceptor los parsea automáticamente de vuelta a arrays.
 *
 * Ejemplo:
 * - Input: body.keywords = '["tag1","tag2"]'
 * - Output: body.keywords = ['tag1', 'tag2']
 */
@Injectable()
export class TransformJsonArraysInterceptor implements NestInterceptor {
  // Campos que deben ser transformados de JSON string a array
  private readonly arrayFields = [
    'keywords',
    'tags',
    'categories',
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const body = request.body;

    if (body) {
      // Transformar cada campo que debería ser array
      this.arrayFields.forEach((field) => {
        if (body[field] && typeof body[field] === 'string') {
          try {
            // Intentar parsear el JSON
            const parsed = JSON.parse(body[field]);

            // Si es un array válido, reemplazar el string
            if (Array.isArray(parsed)) {
              body[field] = parsed;
            }
          } catch (error) {
            // Si no es JSON válido, dejar como está
            // El ValidationPipe se encargará de rechazarlo
          }
        }
      });
    }

    return next.handle();
  }
}
