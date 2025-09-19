# Sistema de Plantillas de Correo Electrónico - Guía Técnica Completa 2025

## Resumen Ejecutivo

Esta documentación proporciona un análisis técnico exhaustivo para implementar un sistema completo de plantillas de correo electrónico para un dashboard, utilizando React + TypeScript + Shadcn en el frontend y NestJS + TypeScript en el backend. El sistema está diseñado para ser robusto, escalable y fácil de mantener.

### Objetivos del Sistema
- **Frontend**: Crear, editar, previsualizar y gestionar plantillas de correo con editor HTML completo
- **Backend**: Procesar variables {{}} dinámicas, validar HTML, y enviar correos usando plantillas
- **Arquitectura**: Microservicios escalables con separación clara de responsabilidades

---

## 1. Análisis de Herramientas Frontend (React + TypeScript)

### 1.1 Editores de Código HTML

#### Opción A: Monaco Editor (@monaco-editor/react)
```bash
npm install @monaco-editor/react
```

**Pros:**
- Editor completo con IntelliSense (similar a VS Code)
- Soporte nativo para HTML, CSS, JavaScript
- Validación de sintaxis en tiempo real
- Autocompletado avanzado
- Soporte completo para TypeScript

**Contras:**
- Bundle grande (~5MB)
- Configuración compleja
- Mayor consumo de recursos

**Implementación:**
```typescript
import { Editor } from '@monaco-editor/react';

interface EmailTemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const EmailTemplateEditor: React.FC<EmailTemplateEditorProps> = ({
  value,
  onChange
}) => {
  return (
    <Editor
      height="600px"
      defaultLanguage="html"
      value={value}
      onChange={(value) => onChange(value || '')}
      options={{
        theme: 'vs-dark',
        minimap: { enabled: false },
        lineNumbers: 'on',
        wordWrap: 'on',
        formatOnPaste: true,
      }}
    />
  );
};
```

#### Opción B: CodeMirror (@uiw/react-codemirror)
```bash
npm install @uiw/react-codemirror @codemirror/lang-html @codemirror/lang-css
```

**Pros:**
- Lightweight y modular
- Carga lazy loading
- Altamente personalizable
- Mejor rendimiento
- Menor bundle size

**Contras:**
- Menos funciones out-of-the-box
- Configuración más manual
- IntelliSense limitado

**Implementación:**
```typescript
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';

interface EmailCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const EmailCodeEditor: React.FC<EmailCodeEditorProps> = ({
  value,
  onChange
}) => {
  return (
    <CodeMirror
      value={value}
      height="600px"
      extensions={[html(), css()]}
      onChange={(val) => onChange(val)}
      theme="dark"
    />
  );
};
```

#### Recomendación: CodeMirror
Para plantillas de email, CodeMirror es más apropiado por su menor tamaño y facilidad de customización específica.

### 1.2 Editores WYSIWYG para Email Templates

#### Opción A: React Email Editor (Unlayer)
```bash
npm install react-email-editor
```

**Pros:**
- Específicamente diseñado para emails
- Drag & drop interface
- Plantillas preconstruidas
- Export/import JSON
- Preview responsive

**Implementación:**
```typescript
import EmailEditor, { EditorRef, EmailEditorProps } from 'react-email-editor';

export const EmailTemplateBuilder: React.FC = () => {
  const emailEditorRef = useRef<EditorRef>(null);

  const exportHtml = () => {
    const unlayer = emailEditorRef.current?.editor;

    unlayer?.exportHtml((data) => {
      const { design, html } = data;
      console.log('Design:', design);
      console.log('HTML:', html);
    });
  };

  return (
    <div>
      <EmailEditor
        ref={emailEditorRef}
        onReady={() => console.log('Editor ready')}
        appearance={{
          theme: 'dark',
          panels: {
            tools: {
              dock: 'left'
            }
          }
        }}
      />
      <button onClick={exportHtml}>Export HTML</button>
    </div>
  );
};
```

#### Opción B: TinyMCE
```bash
npm install @tinymce/tinymce-react
```

**Pros:**
- Editor WYSIWYG maduro
- Plugins extensivos
- Configuración flexible
- Soporte para templates

**Implementación:**
```typescript
import { Editor } from '@tinymce/tinymce-react';

export const TinyMCEEmailEditor: React.FC<EmailEditorProps> = ({
  value,
  onChange
}) => {
  return (
    <Editor
      apiKey="your-tinymce-api-key"
      value={value}
      onEditorChange={(content) => onChange(content)}
      init={{
        height: 500,
        menubar: false,
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount'
        ],
        toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
      }}
    />
  );
};
```

### 1.3 Sistema de Variables y Preview

```typescript
// Tipos para el sistema de variables
export interface EmailVariable {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
  defaultValue?: string;
  description?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  variables: EmailVariable[];
  createdAt: Date;
  updatedAt: Date;
}

// Hook para preview con variables
export const useEmailPreview = (template: EmailTemplate) => {
  const [previewData, setPreviewData] = useState<Record<string, any>>({});

  const generatePreview = useMemo(() => {
    let html = template.htmlContent;
    let subject = template.subject;

    // Reemplazar variables en HTML
    template.variables.forEach(variable => {
      const value = previewData[variable.key] || variable.defaultValue || `{{${variable.key}}}`;
      const regex = new RegExp(`{{\\s*${variable.key}\\s*}}`, 'g');
      html = html.replace(regex, String(value));
      subject = subject.replace(regex, String(value));
    });

    return { html, subject };
  }, [template, previewData]);

  return {
    previewData,
    setPreviewData,
    previewHtml: generatePreview.html,
    previewSubject: generatePreview.subject
  };
};

// Componente de preview
export const EmailPreview: React.FC<{ template: EmailTemplate }> = ({
  template
}) => {
  const { previewHtml, previewData, setPreviewData } = useEmailPreview(template);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Panel de variables */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Variables de Prueba</h3>
        {template.variables.map(variable => (
          <div key={variable.key} className="space-y-2">
            <Label htmlFor={variable.key}>{variable.label}</Label>
            <Input
              id={variable.key}
              type={variable.type === 'number' ? 'number' : 'text'}
              placeholder={variable.defaultValue}
              onChange={(e) => setPreviewData(prev => ({
                ...prev,
                [variable.key]: e.target.value
              }))}
            />
          </div>
        ))}
      </div>

      {/* Preview del email */}
      <div className="lg:col-span-2">
        <div className="border rounded-lg p-4 bg-white">
          <div className="mb-4 pb-2 border-b">
            <strong>Asunto:</strong> {previewSubject}
          </div>
          <iframe
            srcDoc={previewHtml}
            className="w-full h-96 border-0"
            title="Email Preview"
          />
        </div>
      </div>
    </div>
  );
};
```

---

## 2. Arquitectura Backend (NestJS + TypeScript)

### 2.1 Estructura de Módulos

```typescript
// email-templates/email-templates.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailTemplatesController } from './email-templates.controller';
import { EmailTemplatesService } from './email-templates.service';
import { EmailTemplate, EmailTemplateSchema } from './schemas/email-template.schema';
import { EmailRenderingService } from './services/email-rendering.service';
import { EmailValidationService } from './services/email-validation.service';
import { EmailSendingService } from './services/email-sending.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmailTemplate.name, schema: EmailTemplateSchema }
    ])
  ],
  controllers: [EmailTemplatesController],
  providers: [
    EmailTemplatesService,
    EmailRenderingService,
    EmailValidationService,
    EmailSendingService
  ],
  exports: [EmailTemplatesService, EmailRenderingService]
})
export class EmailTemplatesModule {}
```

### 2.2 Esquemas de Base de Datos

```typescript
// schemas/email-template.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EmailTemplateDocument = EmailTemplate & Document;

@Schema({
  timestamps: true,
  collection: 'email_templates'
})
export class EmailTemplate {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  htmlContent: string;

  @Prop({ type: Object, default: {} })
  variables: Record<string, {
    type: 'string' | 'number' | 'date' | 'boolean';
    required: boolean;
    defaultValue?: any;
    description?: string;
  }>;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  description?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop()
  createdBy: string;

  @Prop()
  lastModifiedBy: string;
}

export const EmailTemplateSchema = SchemaFactory.createForClass(EmailTemplate);

// Índices para optimización
EmailTemplateSchema.index({ name: 1 });
EmailTemplateSchema.index({ tags: 1 });
EmailTemplateSchema.index({ isActive: 1 });
```

### 2.3 Sistema de Templating (Handlebars)

```typescript
// services/email-rendering.service.ts
import { Injectable } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import * as moment from 'moment';
import { EmailValidationService } from './email-validation.service';

@Injectable()
export class EmailRenderingService {
  constructor(
    private readonly validationService: EmailValidationService
  ) {
    this.registerHandlebarsHelpers();
  }

  private registerHandlebarsHelpers(): void {
    // Helper para formatear fechas
    Handlebars.registerHelper('formatDate', (date, format = 'DD/MM/YYYY') => {
      return moment(date).format(format);
    });

    // Helper para formatear números
    Handlebars.registerHelper('formatNumber', (number, decimals = 2) => {
      return Number(number).toFixed(decimals);
    });

    // Helper para uppercase
    Handlebars.registerHelper('uppercase', (str) => {
      return str?.toString().toUpperCase();
    });

    // Helper para condicionales
    Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });
  }

  async renderTemplate(
    htmlContent: string,
    subject: string,
    data: Record<string, any>
  ): Promise<{ html: string; subject: string }> {
    try {
      // Compilar plantillas
      const htmlTemplate = Handlebars.compile(htmlContent);
      const subjectTemplate = Handlebars.compile(subject);

      // Renderizar con datos
      const renderedHtml = htmlTemplate(data);
      const renderedSubject = subjectTemplate(data);

      // Validar HTML resultante
      await this.validationService.validateEmailHtml(renderedHtml);

      return {
        html: renderedHtml,
        subject: renderedSubject
      };
    } catch (error) {
      throw new Error(`Error rendering template: ${error.message}`);
    }
  }

  extractVariables(content: string): string[] {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = variableRegex.exec(content)) !== null) {
      const variable = match[1].trim();
      if (!variables.includes(variable)) {
        variables.push(variable);
      }
    }

    return variables;
  }
}
```

### 2.4 Validación de HTML para Emails

```typescript
// services/email-validation.service.ts
import { Injectable } from '@nestjs/common';
import { JSDOM } from 'jsdom';
import * as DOMPurify from 'isomorphic-dompurify';

@Injectable()
export class EmailValidationService {
  private readonly allowedTags = [
    'div', 'table', 'tr', 'td', 'th', 'tbody', 'thead', 'tfoot',
    'p', 'br', 'span', 'strong', 'b', 'em', 'i', 'u', 'a',
    'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li'
  ];

  private readonly allowedAttributes = [
    'style', 'class', 'src', 'alt', 'href', 'target', 'width', 'height',
    'align', 'valign', 'bgcolor', 'color', 'border', 'cellpadding', 'cellspacing'
  ];

  async validateEmailHtml(html: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    sanitizedHtml: string;
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Sanitizar HTML
      const sanitizedHtml = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: this.allowedTags,
        ALLOWED_ATTR: this.allowedAttributes,
        KEEP_CONTENT: true
      });

      // Parsear con JSDOM para validaciones adicionales
      const dom = new JSDOM(sanitizedHtml);
      const document = dom.window.document;

      // Validar estructura básica
      this.validateEmailStructure(document, errors, warnings);

      // Validar CSS inline
      this.validateInlineCSS(document, errors, warnings);

      // Validar imágenes
      this.validateImages(document, errors, warnings);

      // Validar links
      this.validateLinks(document, errors, warnings);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        sanitizedHtml
      };
    } catch (error) {
      errors.push(`HTML parsing error: ${error.message}`);
      return {
        isValid: false,
        errors,
        warnings,
        sanitizedHtml: html
      };
    }
  }

  private validateEmailStructure(document: Document, errors: string[], warnings: string[]): void {
    // Verificar uso de tables para layout
    const divs = document.querySelectorAll('div');
    const tables = document.querySelectorAll('table');

    if (divs.length > tables.length * 2) {
      warnings.push('Consider using table-based layout for better email client compatibility');
    }

    // Verificar ancho máximo
    const elements = document.querySelectorAll('[width], [style*="width"]');
    elements.forEach(element => {
      const width = element.getAttribute('width') ||
        element.getAttribute('style')?.match(/width:\s*(\d+)/)?.[1];
      if (width && parseInt(width) > 600) {
        warnings.push(`Element width ${width}px exceeds recommended 600px for email compatibility`);
      }
    });
  }

  private validateInlineCSS(document: Document, errors: string[], warnings: string[]): void {
    const elementsWithStyle = document.querySelectorAll('[style]');
    const unsupportedProperties = ['position', 'float', 'display: flex', 'display: grid'];

    elementsWithStyle.forEach(element => {
      const style = element.getAttribute('style') || '';

      unsupportedProperties.forEach(prop => {
        if (style.includes(prop)) {
          warnings.push(`Unsupported CSS property "${prop}" found in inline styles`);
        }
      });
    });
  }

  private validateImages(document: Document, errors: string[], warnings: string[]): void {
    const images = document.querySelectorAll('img');

    images.forEach(img => {
      if (!img.getAttribute('alt')) {
        warnings.push('Image missing alt text for accessibility');
      }

      const src = img.getAttribute('src');
      if (src && !src.startsWith('http')) {
        errors.push('All images must use absolute URLs in email templates');
      }
    });
  }

  private validateLinks(document: Document, errors: string[], warnings: string[]): void {
    const links = document.querySelectorAll('a[href]');

    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith('mailto:')) {
        warnings.push('Links should use absolute URLs in email templates');
      }
    });
  }
}
```

### 2.5 Controlador CRUD

```typescript
// email-templates.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ValidationPipe,
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EmailTemplatesService } from './email-templates.service';
import { CreateEmailTemplateDto, UpdateEmailTemplateDto, SendEmailDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Email Templates')
@Controller('email-templates')
@UseGuards(JwtAuthGuard)
export class EmailTemplatesController {
  constructor(
    private readonly emailTemplatesService: EmailTemplatesService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create email template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  async createTemplate(@Body(ValidationPipe) createDto: CreateEmailTemplateDto) {
    return this.emailTemplatesService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all email templates' })
  async getAllTemplates(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('tags') tags?: string
  ) {
    return this.emailTemplatesService.findAll({
      page: Number(page),
      limit: Number(limit),
      search,
      tags: tags?.split(',')
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get email template by ID' })
  async getTemplate(@Param('id') id: string) {
    return this.emailTemplatesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update email template' })
  async updateTemplate(
    @Param('id') id: string,
    @Body(ValidationPipe) updateDto: UpdateEmailTemplateDto
  ) {
    return this.emailTemplatesService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete email template' })
  async deleteTemplate(@Param('id') id: string) {
    return this.emailTemplatesService.remove(id);
  }

  @Post(':id/preview')
  @ApiOperation({ summary: 'Preview email template with data' })
  async previewTemplate(
    @Param('id') id: string,
    @Body() data: Record<string, any>
  ) {
    return this.emailTemplatesService.previewTemplate(id, data);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send email using template' })
  async sendEmail(
    @Param('id') id: string,
    @Body(ValidationPipe) sendDto: SendEmailDto
  ) {
    return this.emailTemplatesService.sendEmailWithTemplate(id, sendDto);
  }

  @Post('validate-html')
  @ApiOperation({ summary: 'Validate HTML for email compatibility' })
  async validateHtml(@Body('html') html: string) {
    return this.emailTemplatesService.validateHtml(html);
  }
}
```

---

## 3. Sistema de Templating y Variables

### 3.1 Comparativa de Motores de Template

| Motor | Pros | Contras | Uso Recomendado |
|-------|------|---------|-----------------|
| **Handlebars** | Logic-less, helpers personalizados, sintaxis clara | Menos features avanzadas | **Recomendado para emails** |
| **Mustache** | Ultra-simple, múltiples lenguajes | Muy limitado | Casos simples |
| **Liquid** | Potente, usado por Shopify | Curva de aprendizaje | E-commerce |
| **EJS** | JavaScript embebido | Mezcla lógica con vista | Prototipado rápido |

### 3.2 Implementación con Handlebars (Recomendado)

```bash
npm install handlebars @types/handlebars moment
```

**Ventajas de Handlebars:**
- Sintaxis limpia `{{variable}}`
- Helpers personalizados
- Precompilación posible
- Logic-less (seguro)
- Excelente para emails

---

## 4. Validación y Preview de Emails

### 4.1 Herramientas de Validación

#### MJML (Recomendado para desarrollo)
```bash
npm install mjml @types/mjml
```

```typescript
// services/mjml-validation.service.ts
import { Injectable } from '@nestjs/common';
import mjml2html from 'mjml';

@Injectable()
export class MJMLValidationService {
  validateAndConvert(mjmlContent: string) {
    const result = mjml2html(mjmlContent, {
      validationLevel: 'strict',
      minify: true
    });

    return {
      html: result.html,
      errors: result.errors,
      isValid: result.errors.length === 0
    };
  }

  generateEmailTemplate(components: any[]) {
    const mjmlTemplate = `
      <mjml>
        <mj-head>
          <mj-attributes>
            <mj-all font-family="Arial, sans-serif" />
            <mj-text font-size="14px" color="#333" line-height="20px" />
          </mj-attributes>
        </mj-head>
        <mj-body>
          ${components.map(comp => this.renderComponent(comp)).join('\n')}
        </mj-body>
      </mjml>
    `;

    return this.validateAndConvert(mjmlTemplate);
  }

  private renderComponent(component: any): string {
    switch (component.type) {
      case 'text':
        return `<mj-section><mj-column><mj-text>${component.content}</mj-text></mj-column></mj-section>`;
      case 'image':
        return `<mj-section><mj-column><mj-image src="${component.src}" alt="${component.alt}" /></mj-column></mj-section>`;
      case 'button':
        return `<mj-section><mj-column><mj-button href="${component.href}">${component.text}</mj-button></mj-column></mj-section>`;
      default:
        return '';
    }
  }
}
```

### 4.2 Testing de Emails

#### Integración con Mailtrap/Litmus
```typescript
// services/email-testing.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailTestingService {
  constructor(private configService: ConfigService) {}

  async testEmailCompatibility(html: string): Promise<{
    score: number;
    issues: Array<{
      type: 'error' | 'warning';
      client: string;
      message: string;
    }>;
  }> {
    // Integración con Litmus API o similar
    const apiKey = this.configService.get('LITMUS_API_KEY');

    // Simulación de test de compatibilidad
    const issues = [];
    let score = 100;

    // Verificar CSS inline
    if (html.includes('<style>')) {
      issues.push({
        type: 'warning',
        client: 'Gmail',
        message: 'CSS styles in <style> tags may be stripped'
      });
      score -= 10;
    }

    // Verificar imágenes sin alt
    if (html.includes('<img') && !html.includes('alt=')) {
      issues.push({
        type: 'warning',
        client: 'All',
        message: 'Images without alt text affect accessibility'
      });
      score -= 5;
    }

    return { score, issues };
  }

  async sendTestEmail(templateId: string, testEmails: string[]): Promise<void> {
    // Enviar emails de prueba usando Mailtrap o similar
    const transportConfig = {
      host: this.configService.get('MAILTRAP_HOST'),
      port: this.configService.get('MAILTRAP_PORT'),
      auth: {
        user: this.configService.get('MAILTRAP_USER'),
        pass: this.configService.get('MAILTRAP_PASS')
      }
    };

    // Implementar envío de prueba
  }
}
```

---

## 5. Arquitectura del Sistema Completo

### 5.1 Diagrama de Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Dashboard │    │   NestJS API    │    │   MongoDB       │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │Template     │ │◄──►│ │Templates    │ │◄──►│ │Templates    │ │
│ │Editor       │ │    │ │Controller   │ │    │ │Collection   │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │Preview      │ │◄──►│ │Rendering    │ │    │ │Variables    │ │
│ │Component    │ │    │ │Service      │ │    │ │Schemas      │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │                 │
│ │Variable     │ │◄──►│ │Validation   │ │    │                 │
│ │Manager      │ │    │ │Service      │ │    │                 │
│ └─────────────┘ │    │ └─────────────┘ │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 5.2 Microservicios Separados (Arquitectura Avanzada)

```typescript
// email-service/main.ts (Microservicio dedicado)
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { EmailServiceModule } from './email-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    EmailServiceModule,
    {
      transport: Transport.REDIS,
      options: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
      },
    },
  );

  await app.listen();
  console.log('Email Microservice is listening...');
}
bootstrap();
```

### 5.3 Patrones de Diseño Implementados

1. **Repository Pattern**: Para acceso a datos
2. **Strategy Pattern**: Para diferentes motores de template
3. **Factory Pattern**: Para crear diferentes tipos de emails
4. **Observer Pattern**: Para notificaciones de cambios
5. **Decorator Pattern**: Para validaciones y transformaciones

---

## 6. Mejores Prácticas para HTML de Emails

### 6.1 Estructura HTML Compatible

```html
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{{subject}}</title>
  <style type="text/css">
    /* CSS que será inlineado */
    .email-container { max-width: 600px; margin: 0 auto; }
    .header { background-color: #f8f9fa; padding: 20px; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td align="center">
        <table class="email-container" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600">
          <!-- Contenido del email -->
          <tr>
            <td class="header">
              <h1 style="margin: 0; color: #333333;">{{title}}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px;">
              <p style="margin: 0 0 16px 0; color: #666666;">
                Hola {{userName}}, {{content}}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### 6.2 CSS Inline Automation

```typescript
// services/css-inline.service.ts
import { Injectable } from '@nestjs/common';
import * as juice from 'juice';

@Injectable()
export class CSSInlineService {
  async inlineCSS(html: string): Promise<string> {
    const options = {
      removeStyleTags: true,
      preserveMediaQueries: true,
      preserveFontFaces: true,
      webResources: {
        relativeTo: process.cwd(),
        strict: false
      }
    };

    return juice(html, options);
  }

  async processEmailTemplate(template: string): Promise<string> {
    // 1. Inline CSS
    let processed = await this.inlineCSS(template);

    // 2. Optimizar para Outlook
    processed = this.addOutlookCompatibility(processed);

    // 3. Optimizar imágenes
    processed = this.optimizeImages(processed);

    return processed;
  }

  private addOutlookCompatibility(html: string): string {
    // Agregar MSO conditionals
    return html.replace(
      /<table([^>]*)>/gi,
      '<table$1><!--[if mso]><table><![endif]-->'
    );
  }

  private optimizeImages(html: string): string {
    // Asegurar que todas las imágenes tengan dimensiones
    return html.replace(
      /<img([^>]*?)>/gi,
      (match, attrs) => {
        if (!attrs.includes('width=') && !attrs.includes('height=')) {
          return `<img${attrs} style="max-width: 100%; height: auto;">`;
        }
        return match;
      }
    );
  }
}
```

---

## 7. Seguridad

### 7.1 Sanitización de HTML

```bash
npm install dompurify @types/dompurify xss
```

```typescript
// services/security.service.ts
import { Injectable } from '@nestjs/common';
import * as DOMPurify from 'isomorphic-dompurify';
import * as xss from 'xss';

@Injectable()
export class EmailSecurityService {
  private readonly xssOptions = {
    whiteList: {
      table: ['width', 'height', 'border', 'cellpadding', 'cellspacing', 'style'],
      tr: ['style'],
      td: ['width', 'height', 'colspan', 'rowspan', 'style', 'align', 'valign'],
      th: ['width', 'height', 'colspan', 'rowspan', 'style', 'align', 'valign'],
      div: ['style', 'class'],
      p: ['style', 'class'],
      span: ['style', 'class'],
      strong: ['style'],
      b: ['style'],
      em: ['style'],
      i: ['style'],
      a: ['href', 'target', 'style'],
      img: ['src', 'alt', 'width', 'height', 'style'],
      h1: ['style'], h2: ['style'], h3: ['style'], h4: ['style'], h5: ['style'], h6: ['style']
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style']
  };

  sanitizeEmailHTML(html: string): string {
    // Primera pasada con XSS
    let sanitized = xss(html, this.xssOptions);

    // Segunda pasada con DOMPurify
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: [
        'div', 'table', 'tr', 'td', 'th', 'tbody', 'thead', 'tfoot',
        'p', 'br', 'span', 'strong', 'b', 'em', 'i', 'u', 'a',
        'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
      ],
      ALLOWED_ATTR: [
        'style', 'class', 'src', 'alt', 'href', 'target', 'width', 'height',
        'align', 'valign', 'bgcolor', 'color', 'border', 'cellpadding', 'cellspacing'
      ]
    });

    return sanitized;
  }

  validateVariableInjection(template: string, data: Record<string, any>): {
    isValid: boolean;
    risks: string[];
  } {
    const risks: string[] = [];

    // Verificar inyección de scripts en variables
    for (const [key, value] of Object.entries(data)) {
      const strValue = String(value);

      if (/<script/i.test(strValue)) {
        risks.push(`Variable '${key}' contains script tags`);
      }

      if (/javascript:/i.test(strValue)) {
        risks.push(`Variable '${key}' contains javascript: protocol`);
      }

      if (/<iframe/i.test(strValue)) {
        risks.push(`Variable '${key}' contains iframe tags`);
      }
    }

    return {
      isValid: risks.length === 0,
      risks
    };
  }
}
```

### 7.2 Rate Limiting y Validación

```typescript
// guards/email-rate-limit.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class EmailRateLimitGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.user?.id || req.ip;
  }

  protected getLimit(context: ExecutionContext): number {
    // Límite específico para envío de emails
    return 10; // 10 emails por minuto por usuario
  }
}
```

---

## 8. Testing

### 8.1 Testing Backend (Jest)

```typescript
// email-templates.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { EmailTemplatesService } from './email-templates.service';
import { EmailTemplate } from './schemas/email-template.schema';

describe('EmailTemplatesService', () => {
  let service: EmailTemplatesService;
  let mockModel;

  beforeEach(async () => {
    mockModel = {
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findOneAndDelete: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailTemplatesService,
        {
          provide: getModelToken(EmailTemplate.name),
          useValue: mockModel
        }
      ],
    }).compile();

    service = module.get<EmailTemplatesService>(EmailTemplatesService);
  });

  describe('renderTemplate', () => {
    it('should replace variables correctly', async () => {
      const template = 'Hello {{name}}, your order {{orderId}} is ready!';
      const data = { name: 'John', orderId: '12345' };

      const result = await service.renderTemplate(template, 'Order Ready', data);

      expect(result.html).toBe('Hello John, your order 12345 is ready!');
    });

    it('should handle missing variables', async () => {
      const template = 'Hello {{name}}, welcome to {{company}}!';
      const data = { name: 'John' };

      const result = await service.renderTemplate(template, 'Welcome', data);

      expect(result.html).toContain('John');
      expect(result.html).toContain('{{company}}'); // Variable no reemplazada
    });
  });
});
```

### 8.2 Testing Frontend (Cypress)

```typescript
// cypress/integration/email-templates.spec.ts
describe('Email Templates Dashboard', () => {
  beforeEach(() => {
    cy.login('admin@example.com', 'password');
    cy.visit('/dashboard/email-templates');
  });

  it('should create a new email template', () => {
    cy.get('[data-cy=new-template-btn]').click();

    cy.get('[data-cy=template-name]').type('Welcome Email');
    cy.get('[data-cy=template-subject]').type('Welcome to {{company}}!');

    // Usar el editor de código
    cy.get('[data-cy=html-editor]').type(`
      <table width="600">
        <tr>
          <td>
            <h1>Welcome {{userName}}!</h1>
            <p>Thank you for joining {{company}}.</p>
          </td>
        </tr>
      </table>
    `);

    // Agregar variables
    cy.get('[data-cy=add-variable-btn]').click();
    cy.get('[data-cy=variable-key]').type('userName');
    cy.get('[data-cy=variable-label]').type('User Name');
    cy.get('[data-cy=variable-type]').select('string');

    cy.get('[data-cy=save-template-btn]').click();

    cy.get('[data-cy=success-message]').should('be.visible');
  });

  it('should preview template with test data', () => {
    cy.get('[data-cy=template-item]').first().click();

    cy.get('[data-cy=preview-tab]').click();

    // Llenar datos de prueba
    cy.get('[data-cy=variable-userName]').type('John Doe');
    cy.get('[data-cy=variable-company]').type('Test Company');

    cy.get('[data-cy=update-preview-btn]').click();

    // Verificar preview
    cy.get('[data-cy=email-preview-iframe]')
      .its('0.contentDocument.body')
      .should('contain.text', 'John Doe')
      .and('contain.text', 'Test Company');
  });
});
```

---

## 9. Deployment y DevOps

### 9.1 Docker Configuration

```dockerfile
# Dockerfile para NestJS
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["node", "dist/main"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  email-service:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/email-templates
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis
    volumes:
      - ./uploads:/app/uploads

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  mongo_data:
```

### 9.2 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy Email Template System

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:cov

      - name: Run e2e tests
        run: npm run test:e2e

      - name: Security audit
        run: npm audit --audit-level=high

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          docker build -t email-service:latest .
          docker push ${{ secrets.DOCKER_REGISTRY }}/email-service:latest
```

---

## 10. Estimación y Roadmap

### 10.1 Estimación de Complejidad

| Componente | Complejidad | Tiempo Estimado |
|------------|-------------|-----------------|
| **Frontend Editor** | Media | 2-3 semanas |
| **Sistema de Variables** | Media | 1-2 semanas |
| **Preview Component** | Baja | 1 semana |
| **Backend CRUD** | Baja | 1 semana |
| **Template Engine** | Media | 2 semanas |
| **Validación HTML** | Alta | 2-3 semanas |
| **Sistema de Envío** | Media | 1-2 semanas |
| **Testing Completo** | Media | 2 semanas |
| **Security & Audit** | Alta | 1-2 semanas |
| **Documentation** | Baja | 1 semana |

**Total Estimado: 12-18 semanas** (3-4 meses con 1 desarrollador senior)

### 10.2 Roadmap de Implementación

#### Fase 1: MVP (4-6 semanas)
- [ ] Backend básico con CRUD
- [ ] Editor de código HTML
- [ ] Sistema básico de variables
- [ ] Preview simple
- [ ] Integración con sistema de envío existente

#### Fase 2: Funcionalidades Avanzadas (4-6 semanas)
- [ ] Validación completa de HTML
- [ ] Editor WYSIWYG opcional
- [ ] Sistema de plantillas prediseñadas
- [ ] Testing automatizado
- [ ] Optimización de rendimiento

#### Fase 3: Características Empresariales (4-6 semanas)
- [ ] Roles y permisos
- [ ] Historial de versiones
- [ ] A/B Testing de plantillas
- [ ] Analytics de emails
- [ ] Integración con servicios externos

### 10.3 Tecnologías Finales Recomendadas

**Frontend:**
- **Editor**: CodeMirror para código + React Email Editor para WYSIWYG
- **Framework**: React 18 + TypeScript + Shadcn/ui
- **Estado**: Zustand o Redux Toolkit Query
- **Forms**: React Hook Form + Zod

**Backend:**
- **Framework**: NestJS + TypeScript
- **Template Engine**: Handlebars
- **Validación**: Custom service + MJML para desarrollo
- **Base de Datos**: MongoDB con Mongoose
- **Cache**: Redis
- **Queue**: Bull/BullMQ para emails

**Testing:**
- **Unit**: Jest + Testing Library
- **E2E**: Cypress
- **Email Testing**: Mailtrap para desarrollo, Litmus para producción

**DevOps:**
- **Containerización**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Winston + Elasticsearch (opcional)

---

## Conclusiones

Este sistema de plantillas de correo proporciona una solución robusta y escalable para la gestión de emails transaccionales. La arquitectura propuesta separa claramente las responsabilidades, permite testing automatizado, y mantiene altos estándares de seguridad.

**Puntos clave del éxito:**
1. **Uso de tecnologías maduras** y bien soportadas
2. **Arquitectura modular** que permite extensibilidad
3. **Testing comprehensivo** en todas las capas
4. **Seguridad by design** con sanitización y validación
5. **Experiencia de usuario** fluida tanto para editores como usuarios finales

La implementación por fases permite entregar valor temprano mientras se desarrollan funcionalidades más avanzadas.

---

**Última actualización**: Septiembre 2025
**Autor**: Investigación Técnica Completa - Sistema de Email Templates
**Versión**: 1.0.0