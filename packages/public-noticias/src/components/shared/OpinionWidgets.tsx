import React from 'react';
import { Link } from '@tanstack/react-router';

/**
 * OPINION WIDGETS - Componentes para Sidebar
 *
 * Componentes de columnas de opinión y editorial
 * con estética brutalist para el sidebar de homepage
 */

// ==================== INTERFACES ====================

interface OpinionColumn {
  id: string;
  authorPhoto: string;
  authorName: string;
  title: string;
  description: string;
  category: string;
  date: string;
  frequency: 'SEMANAL' | 'QUINCENAL';
}

interface Editorial {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
}

interface OpinionColumnsWidgetProps {
  columns: OpinionColumn[];
}

interface EditorialWidgetProps {
  editorial: Editorial;
}

// ==================== MOCK DATA ====================

export const MOCK_COLUMNS: OpinionColumn[] = [
  {
    id: '1',
    authorPhoto: 'https://placehold.co/80x80/854836/FFFFFF?text=JM',
    authorName: 'JORGE MORALES',
    title: 'EL PULSO POLÍTICO',
    description: 'Análisis profundo de la política local y nacional con una perspectiva crítica.',
    category: 'POLÍTICA',
    date: '10 OCT 2025',
    frequency: 'SEMANAL',
  },
  {
    id: '2',
    authorPhoto: 'https://placehold.co/80x80/FF0000/FFFFFF?text=AS',
    authorName: 'ANA SILVA',
    title: 'ECONOMÍA AL DÍA',
    description: 'Las tendencias económicas que afectan a Pachuca y sus habitantes.',
    category: 'ECONOMÍA',
    date: '08 OCT 2025',
    frequency: 'QUINCENAL',
  },
];

export const MOCK_EDITORIAL: Editorial = {
  id: '1',
  title: 'PACHUCA NECESITA UN TRANSPORTE PÚBLICO EFICIENTE',
  excerpt: 'El crecimiento de nuestra ciudad exige una modernización urgente del sistema de transporte. Los ciudadanos merecen opciones seguras, limpias y puntuales que conecten todos los sectores.',
  date: '10 OCT 2025',
  author: 'REDACCIÓN NOTICIAS PACHUCA',
};

// ==================== COMPONENTES ====================

/**
 * Widget de Columnas de Opinión
 * Muestra columnistas destacados con frecuencia de publicación
 */
export const OpinionColumnsWidget: React.FC<OpinionColumnsWidgetProps> = ({ columns }) => (
  <div className="bg-white border-2 border-black p-4 relative">
    <div className="absolute -top-2 -left-2 w-6 h-6 bg-[#854836] transform rotate-45"></div>

    <h2 className="text-xl font-black uppercase tracking-tight text-black mb-4 border-b-2 border-black pb-2">
      COLUMNAS DE<br />OPINIÓN
    </h2>

    <div className="space-y-4">
      {columns.map((column) => (
        <article
          key={column.id}
          className="border-b-2 border-[#F7F7F7] pb-4 last:border-b-0 hover:bg-[#F7F7F7] transition-colors cursor-pointer p-2 -m-2"
        >
          {/* Header con foto y nombre */}
          <div className="flex items-center gap-3 mb-2">
            <img
              src={column.authorPhoto}
              alt={column.authorName}
              className="w-12 h-12 object-cover border-2 border-black"
            />
            <div className="flex-1">
              <h3 className="text-sm font-black uppercase tracking-tight text-black leading-tight">
                {column.authorName}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-[#854836] px-2 py-0.5 border border-black">
                  {column.frequency}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#854836]">
                  {column.category}
                </span>
              </div>
            </div>
          </div>

          {/* Título de la columna */}
          <h4 className="text-base font-bold uppercase tracking-tight text-black leading-tight mb-2 hover:text-[#854836] transition-colors">
            {column.title}
          </h4>

          {/* Descripción */}
          <p className="text-xs text-black leading-relaxed mb-2">
            {column.description}
          </p>

          {/* Fecha */}
          <div className="text-[10px] text-[#854836] font-bold uppercase tracking-wider">
            {column.date}
          </div>
        </article>
      ))}
    </div>

    {/* Botón ver todas */}
    <Link
      to="/columna-opinion"
      className="block w-full mt-4 bg-black text-white py-2 font-bold uppercase text-xs border-2 border-black hover:bg-[#854836] transition-colors text-center"
    >
      VER TODOS LOS COLUMNISTAS →
    </Link>
  </div>
);

/**
 * Widget Editorial
 * Muestra el editorial destacado del día con link a /editorial
 */
export const EditorialWidget: React.FC<EditorialWidgetProps> = ({ editorial }) => (
  <div className="bg-[#854836] border-4 border-black p-4 relative">
    <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#FFB22C] transform rotate-45"></div>

    <h2 className="text-lg font-black uppercase tracking-tight text-white mb-3 border-b-2 border-white pb-2">
      EDITORIAL
    </h2>

    <article className="space-y-3">
      {/* Título */}
      <Link to="/editorial" className="block">
        <h3 className="text-lg font-bold uppercase tracking-tight text-white leading-tight hover:text-[#FFB22C] transition-colors cursor-pointer">
          {editorial.title}
        </h3>
      </Link>

      {/* Excerpt - Truncado a 5 líneas */}
      <p className="text-sm text-white leading-relaxed line-clamp-5">
        {editorial.excerpt}
      </p>

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs text-white border-t-2 border-white pt-3">
        <div className="flex flex-col gap-1">
          <span className="font-bold uppercase tracking-wider">
            {editorial.author}
          </span>
          <span className="font-bold uppercase opacity-80">
            {editorial.date}
          </span>
        </div>
      </div>

      {/* Botón Leer Más con Link */}
      <Link
        to="/editorial"
        className="block w-full bg-white text-[#854836] py-2 font-bold uppercase text-sm border-2 border-black hover:bg-[#FFB22C] hover:text-black transition-colors relative group text-center"
      >
        LEER MÁS
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-black transform rotate-45 group-hover:bg-white transition-colors"></div>
      </Link>
    </article>
  </div>
);

// Exportar todo
export default {
  OpinionColumnsWidget,
  EditorialWidget,
  MOCK_COLUMNS,
  MOCK_EDITORIAL,
};
