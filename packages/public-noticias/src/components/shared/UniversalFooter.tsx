import { Link } from '@tanstack/react-router';

/**
 * 🏗️ UNIVERSAL FOOTER - Noticias Pachuca
 * Footer reutilizable para todas las páginas
 * Diseño brutalist con navegación y enlaces
 */

export function UniversalFooter() {
  return (
    <footer className="bg-black text-white border-t-4 border-[#FFB22C] mt-12">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">

          {/* Secciones */}
          <div>
            <h4 className="font-black uppercase text-[#FFB22C] mb-3 tracking-wider">SECCIONES</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-[#FFB22C] transition-colors uppercase font-bold">
                  PÁGINA PRINCIPAL
                </Link>
              </li>
              <li>
                <Link to="/categoria/$slug" params={{ slug: 'local' }} className="hover:text-[#FFB22C] transition-colors uppercase font-bold">
                  LOCAL
                </Link>
              </li>
              <li>
                <Link to="/categoria/$slug" params={{ slug: 'politica' }} className="hover:text-[#FFB22C] transition-colors uppercase font-bold">
                  POLÍTICA
                </Link>
              </li>
              <li>
                <Link to="/categoria/$slug" params={{ slug: 'deportes' }} className="hover:text-[#FFB22C] transition-colors uppercase font-bold">
                  DEPORTES
                </Link>
              </li>
              <li>
                <Link to="/categoria/$slug" params={{ slug: 'economia' }} className="hover:text-[#FFB22C] transition-colors uppercase font-bold">
                  ECONOMÍA
                </Link>
              </li>
              <li>
                <Link to="/categoria/$slug" params={{ slug: 'cultura' }} className="hover:text-[#FFB22C] transition-colors uppercase font-bold">
                  CULTURA
                </Link>
              </li>
              <li>
                <Link to="/categoria/$slug" params={{ slug: 'tecnologia' }} className="hover:text-[#FFB22C] transition-colors uppercase font-bold">
                  TECNOLOGÍA
                </Link>
              </li>
            </ul>
          </div>

          {/* Boletines - ✅ ARREGLADO: Ahora son Links en vez de buttons */}
          <div>
            <h4 className="font-black uppercase text-[#FFB22C] mb-3 tracking-wider">BOLETINES</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/boletin/manana" className="hover:text-[#FFB22C] transition-colors uppercase font-bold">
                  LA MAÑANA
                </Link>
              </li>
              <li>
                <Link to="/boletin/tarde" className="hover:text-[#FFB22C] transition-colors uppercase font-bold">
                  LA TARDE
                </Link>
              </li>
              <li>
                <Link to="/boletin/semanal" className="hover:text-[#FFB22C] transition-colors uppercase font-bold">
                  RESUMEN SEMANAL
                </Link>
              </li>
              <li>
                <Link to="/boletin/deportes" className="hover:text-[#FFB22C] transition-colors uppercase font-bold">
                  DEPORTES HOY
                </Link>
              </li>
            </ul>
          </div>

          {/* Más */}
          <div>
            <h4 className="font-black uppercase text-[#FFB22C] mb-3 tracking-wider">MÁS</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/contacto" className="hover:text-[#FFB22C] transition-colors uppercase font-bold">
                  CONTACTO
                </Link>
              </li>
              <li>
                <Link to="/publicidad" className="hover:text-[#FFB22C] transition-colors uppercase font-bold">
                  PUBLICIDAD
                </Link>
              </li>
              <li>
                <Link to="/suscripciones" className="hover:text-[#FFB22C] transition-colors uppercase font-bold">
                  SUSCRIPCIONES
                </Link>
              </li>
              <li>
                <Link to="/aviso-privacidad" className="hover:text-[#FFB22C] transition-colors uppercase font-bold">
                  AVISO DE PRIVACIDAD
                </Link>
              </li>
            </ul>
          </div>

          {/* Logo Footer */}
          <div className="col-span-2 md:col-span-1 text-center">
            <div className="border-2 border-[#FFB22C] p-4 relative inline-block">
              <div className="absolute -top-2 -left-2 w-4 h-4 bg-[#FF0000] transform rotate-45"></div>
              <h2 className="text-2xl font-black uppercase tracking-wider text-[#FFB22C] mb-1">NOTICIAS</h2>
              <h3 className="text-2xl font-black uppercase tracking-wider text-white">PACHUCA</h3>
              <div className="w-12 h-1 bg-[#FFB22C] mx-auto mt-2"></div>
              <div className="absolute -bottom-2 -right-2 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent border-b-[#FFB22C]"></div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t-2 border-[#FFB22C] pt-6 mt-6 text-center">
          <p className="text-sm font-bold uppercase tracking-wider">
            © 2025 NOTICIAS PACHUCA. TODOS LOS DERECHOS RESERVADOS.
          </p>
          <p className="text-xs text-[#FFB22C] mt-1 font-bold uppercase">
            HIDALGO, MÉXICO
          </p>
        </div>
      </div>
    </footer>
  );
}
