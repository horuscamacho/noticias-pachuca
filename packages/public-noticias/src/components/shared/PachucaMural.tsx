interface PachucaMuralProps {
  variant?: number;
  className?: string;
}

export function PachucaMural({ variant, className = '' }: PachucaMuralProps) {
  // Seleccionar mural aleatorio si no se especifica variant
  const muralIndex = variant ?? Math.floor(Math.random() * 5);

  // Asegurar que className siempre incluya overflow-hidden
  const finalClassName = className.includes('overflow-hidden')
    ? className
    : `${className} overflow-hidden`.trim();

  // MURAL 1: ESTADIO HIDALGO - Estadio de fútbol circular/ovalado
  const EstadioHidalgo = () => (
    <div className="w-full h-full relative overflow-hidden bg-[#F7F7F7]">
      {/* Cielo de fondo */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-[#E0E0E0]"></div>

      {/* Estructura exterior del estadio - óvalo principal */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-36 h-20 bg-[#CCCCCC] border-4 border-black rounded-[50%] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"></div>

      {/* Estructura interior del estadio */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 translate-y-1 w-32 h-16 bg-[#B0B0B0] border-4 border-black rounded-[50%]"></div>

      {/* Campo de fútbol - área verde central */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 translate-y-3 w-24 h-10 bg-[#2ECC40] border-4 border-black rounded-[50%]"></div>

      {/* Líneas del campo - patrón central */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 translate-y-[22px] w-0.5 h-10 bg-white z-10"></div>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 translate-y-[26px] w-4 h-4 rounded-full border-2 border-white z-10"></div>

      {/* Tribuna superior - techo/cubierta */}
      <div className="absolute top-[28%] left-1/2 -translate-x-1/2 w-40 h-6 bg-[#854836] border-4 border-black rounded-t-[50%] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"></div>

      {/* Patrón de asientos - lado izquierdo */}
      <div className="absolute top-[38%] left-[22%] w-1 h-3 bg-[#FF0000] border border-black"></div>
      <div className="absolute top-[38%] left-[25%] w-1 h-3 bg-[#FFB22C] border border-black"></div>
      <div className="absolute top-[38%] left-[28%] w-1 h-3 bg-[#FF0000] border border-black"></div>
      <div className="absolute top-[38%] left-[31%] w-1 h-3 bg-[#FFB22C] border border-black"></div>

      {/* Patrón de asientos - lado derecho */}
      <div className="absolute top-[38%] right-[22%] w-1 h-3 bg-[#FF0000] border border-black"></div>
      <div className="absolute top-[38%] right-[25%] w-1 h-3 bg-[#FFB22C] border border-black"></div>
      <div className="absolute top-[38%] right-[28%] w-1 h-3 bg-[#FF0000] border border-black"></div>
      <div className="absolute top-[38%] right-[31%] w-1 h-3 bg-[#FFB22C] border border-black"></div>

      {/* Torres/Pilares estructurales */}
      <div className="absolute top-[25%] left-[15%] w-3 h-12 bg-[#854836] border-2 border-black"></div>
      <div className="absolute top-[25%] right-[15%] w-3 h-12 bg-[#854836] border-2 border-black"></div>

      {/* Reflectores/Luces del estadio */}
      <div className="absolute top-[20%] left-[13%] w-2 h-2 rounded-full bg-[#FFB22C] border-2 border-black"></div>
      <div className="absolute top-[20%] left-[20%] w-2 h-2 rounded-full bg-[#FFB22C] border-2 border-black"></div>
      <div className="absolute top-[20%] right-[13%] w-2 h-2 rounded-full bg-[#FFB22C] border-2 border-black"></div>
      <div className="absolute top-[20%] right-[20%] w-2 h-2 rounded-full bg-[#FFB22C] border-2 border-black"></div>

      {/* Detalles arquitectónicos - rectángulos decorativos */}
      <div className="absolute bottom-2 left-4 w-4 h-3 bg-white border-2 border-black transform rotate-12"></div>
      <div className="absolute bottom-2 right-4 w-4 h-3 bg-white border-2 border-black transform -rotate-12"></div>
    </div>
  );

  // MURAL 2: PISO BEN GURION - Mosaico geométrico gigante
  const PisoBenGurion = () => (
    <div className="w-full h-full relative overflow-hidden bg-[#F7F7F7]">
      {/* Polígonos irregulares - patrón tipo mosaico */}

      {/* Fila superior */}
      <div className="absolute top-0 left-0 w-16 h-12 bg-[#FF0000] border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
           style={{ clipPath: 'polygon(0 0, 80% 0, 100% 100%, 20% 100%)' }}></div>

      <div className="absolute top-0 left-12 w-20 h-14 bg-[#FFB22C] border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
           style={{ clipPath: 'polygon(20% 0, 100% 0, 90% 100%, 0 80%)' }}></div>

      <div className="absolute top-2 left-28 w-18 h-16 bg-[#2ECC40] border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
           style={{ clipPath: 'polygon(0 0, 100% 10%, 100% 100%, 10% 100%)' }}></div>

      <div className="absolute top-0 right-0 w-24 h-18 bg-[#0074D9] border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
           style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 100%, 0 90%)' }}></div>

      {/* Fila media */}
      <div className="absolute top-12 left-2 w-14 h-20 bg-[#B10DC9] border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
           style={{ clipPath: 'polygon(0 10%, 90% 0, 100% 90%, 20% 100%)' }}></div>

      <div className="absolute top-16 left-14 w-22 h-16 bg-[#FF4136] border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
           style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0 100%)' }}></div>

      <div className="absolute top-14 left-32 w-16 h-18 bg-[#FFDC00] border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
           style={{ clipPath: 'polygon(0 0, 100% 20%, 100% 100%, 0 80%)' }}></div>

      <div className="absolute top-18 right-8 w-20 h-14 bg-[#01FF70] border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
           style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 10% 100%)' }}></div>

      {/* Fila inferior */}
      <div className="absolute bottom-0 left-0 w-18 h-16 bg-[#F012BE] border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
           style={{ clipPath: 'polygon(0 0, 100% 10%, 90% 100%, 0 100%)' }}></div>

      <div className="absolute bottom-2 left-16 w-16 h-18 bg-[#3D9970] border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
           style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 100%, 0 90%)' }}></div>

      <div className="absolute bottom-0 left-28 w-20 h-20 bg-[#FF851B] border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
           style={{ clipPath: 'polygon(0 20%, 80% 0, 100% 100%, 20% 100%)' }}></div>

      <div className="absolute bottom-4 right-4 w-16 h-16 bg-[#85144b] border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
           style={{ clipPath: 'polygon(0 0, 100% 0, 100% 80%, 10% 100%)' }}></div>

      {/* Polígonos pequeños de acento */}
      <div className="absolute top-8 left-24 w-8 h-8 bg-[#39CCCC] border-4 border-black transform rotate-45"></div>
      <div className="absolute top-24 left-8 w-6 h-6 bg-[#AAAAAA] border-4 border-black transform rotate-12"></div>
      <div className="absolute bottom-12 right-16 w-8 h-8 bg-[#111111] border-4 border-black transform -rotate-45"></div>

      {/* Círculos de acento */}
      <div className="absolute top-20 right-20 w-6 h-6 rounded-full bg-white border-4 border-black"></div>
      <div className="absolute bottom-8 left-36 w-5 h-5 rounded-full bg-[#FF0000] border-4 border-black"></div>
    </div>
  );

  // MURAL 3: TEATRO BEN GURION - Estructura tipo concha acústica
  const TeatroBenGurion = () => (
    <div className="w-full h-full relative overflow-hidden bg-[#87CEEB]">
      {/* Cielo de fondo */}
      <div className="absolute top-0 left-0 w-full h-2/3 bg-[#87CEEB]"></div>

      {/* Agua/fuente - base inferior */}
      <div className="absolute bottom-0 left-0 w-full h-1/3 bg-[#4682B4] border-t-4 border-black"></div>

      {/* Ondas del agua */}
      <div className="absolute bottom-8 left-4 w-12 h-1 bg-white border border-black rounded-full opacity-60"></div>
      <div className="absolute bottom-6 left-10 w-16 h-1 bg-white border border-black rounded-full opacity-60"></div>
      <div className="absolute bottom-10 right-8 w-14 h-1 bg-white border border-black rounded-full opacity-60"></div>

      {/* Concha acústica - estructura parabólica principal */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-32 h-24 bg-white border-4 border-black rounded-t-[50%] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"></div>

      {/* Líneas curvas interiores de la concha - patrón arquitectónico */}
      <div className="absolute top-[26%] left-1/2 -translate-x-1/2 w-28 h-20 bg-[#F7F7F7] border-2 border-black rounded-t-[50%]"></div>
      <div className="absolute top-[28%] left-1/2 -translate-x-1/2 w-24 h-16 bg-white border-2 border-black rounded-t-[50%]"></div>
      <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-20 h-12 bg-[#F7F7F7] border-2 border-black rounded-t-[50%]"></div>

      {/* Escenario central - área de presentación */}
      <div className="absolute top-[42%] left-1/2 -translate-x-1/2 w-20 h-8 bg-[#CCCCCC] border-4 border-black"></div>

      {/* Piso del escenario */}
      <div className="absolute top-[48%] left-1/2 -translate-x-1/2 w-24 h-2 bg-[#854836] border-2 border-black"></div>

      {/* Gradas verdes - lado izquierdo */}
      <div className="absolute top-[50%] left-[20%] w-16 h-3 bg-[#2ECC40] border-2 border-black"></div>
      <div className="absolute top-[54%] left-[18%] w-18 h-3 bg-[#27AE60] border-2 border-black"></div>
      <div className="absolute top-[58%] left-[16%] w-20 h-3 bg-[#229954] border-2 border-black"></div>

      {/* Gradas verdes - lado derecho */}
      <div className="absolute top-[50%] right-[20%] w-16 h-3 bg-[#2ECC40] border-2 border-black"></div>
      <div className="absolute top-[54%] right-[18%] w-18 h-3 bg-[#27AE60] border-2 border-black"></div>
      <div className="absolute top-[58%] right-[16%] w-20 h-3 bg-[#229954] border-2 border-black"></div>

      {/* Estructura de soporte - pilares */}
      <div className="absolute top-[25%] left-[30%] w-2 h-20 bg-[#CCCCCC] border-2 border-black"></div>
      <div className="absolute top-[25%] right-[30%] w-2 h-20 bg-[#CCCCCC] border-2 border-black"></div>

      {/* Detalles arquitectónicos - secciones de la concha */}
      <div className="absolute top-[32%] left-1/2 -translate-x-1/2 w-16 h-1 bg-black"></div>
      <div className="absolute top-[36%] left-1/2 -translate-x-1/2 w-12 h-1 bg-black"></div>

      {/* Reflejo en el agua - círculo */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-16 h-4 bg-white border-2 border-black rounded-full opacity-40"></div>

      {/* Elementos decorativos - círculos flotantes */}
      <div className="absolute top-8 left-8 w-4 h-4 rounded-full bg-white border-2 border-black"></div>
      <div className="absolute top-12 right-12 w-3 h-3 rounded-full bg-[#FFB22C] border-2 border-black"></div>
    </div>
  );

  // MURAL 4: CERRO DE CUBITOS - Casitas coloridas en cerro
  const CerroDeCubitos = () => (
    <div className="w-full h-full relative overflow-hidden bg-[#87CEEB]">
      {/* Cielo de fondo */}
      <div className="absolute top-0 left-0 w-full h-2/3 bg-[#87CEEB]"></div>

      {/* Montaña/cerro - forma triangular */}
      <div className="absolute bottom-0 left-0 w-0 h-0
        border-l-[200px] border-l-transparent
        border-r-[200px] border-r-transparent
        border-b-[140px] border-b-[#8B7355]"></div>

      {/* Borde del cerro */}
      <div className="absolute bottom-0 left-0 w-0 h-0
        border-l-[200px] border-l-transparent
        border-r-[200px] border-r-transparent
        border-b-[140px] border-b-black opacity-30"></div>

      {/* Casitas coloridas - fila superior */}
      <div className="absolute bottom-[80px] left-[45%] w-6 h-6 bg-[#FF0000] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform -rotate-6"></div>
      <div className="absolute bottom-[82px] left-[52%] w-5 h-5 bg-[#FFB22C] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform rotate-3"></div>

      {/* Casitas coloridas - fila media-alta */}
      <div className="absolute bottom-[60px] left-[35%] w-7 h-7 bg-[#2ECC40] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform rotate-6"></div>
      <div className="absolute bottom-[62px] left-[42%] w-6 h-6 bg-[#0074D9] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform -rotate-3"></div>
      <div className="absolute bottom-[64px] left-[50%] w-6 h-6 bg-[#B10DC9] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform rotate-12"></div>
      <div className="absolute bottom-[58px] left-[58%] w-7 h-7 bg-[#FF4136] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform -rotate-8"></div>

      {/* Casitas coloridas - fila media */}
      <div className="absolute bottom-[40px] left-[28%] w-8 h-8 bg-[#FFDC00] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform -rotate-4"></div>
      <div className="absolute bottom-[38px] left-[36%] w-7 h-7 bg-[#01FF70] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform rotate-8"></div>
      <div className="absolute bottom-[42px] left-[44%] w-6 h-6 bg-[#F012BE] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform -rotate-6"></div>
      <div className="absolute bottom-[40px] left-[52%] w-8 h-8 bg-[#3D9970] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform rotate-4"></div>
      <div className="absolute bottom-[36px] left-[60%] w-7 h-7 bg-[#FF851B] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform -rotate-12"></div>
      <div className="absolute bottom-[38px] left-[68%] w-6 h-6 bg-[#85144b] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform rotate-6"></div>

      {/* Casitas coloridas - fila inferior */}
      <div className="absolute bottom-[18px] left-[20%] w-8 h-8 bg-[#39CCCC] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform rotate-3"></div>
      <div className="absolute bottom-[16px] left-[28%] w-9 h-9 bg-[#FF0000] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform -rotate-6"></div>
      <div className="absolute bottom-[20px] left-[38%] w-7 h-7 bg-[#FFB22C] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform rotate-9"></div>
      <div className="absolute bottom-[18px] left-[46%] w-8 h-8 bg-[#2ECC40] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform -rotate-4"></div>
      <div className="absolute bottom-[16px] left-[54%] w-9 h-9 bg-[#0074D9] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform rotate-6"></div>
      <div className="absolute bottom-[18px] left-[64%] w-7 h-7 bg-[#B10DC9] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform -rotate-8"></div>
      <div className="absolute bottom-[20px] left-[72%] w-8 h-8 bg-[#FF4136] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform rotate-12"></div>

      {/* Ventanas en algunas casitas */}
      <div className="absolute bottom-[22px] left-[30%] w-2 h-2 bg-[#FFB22C] border border-black"></div>
      <div className="absolute bottom-[44px] left-[38%] w-1.5 h-1.5 bg-white border border-black"></div>
      <div className="absolute bottom-[20px] left-[56%] w-2 h-2 bg-[#FFDC00] border border-black"></div>

      {/* Nubes decorativas */}
      <div className="absolute top-4 left-8 w-8 h-3 bg-white border-2 border-black rounded-full"></div>
      <div className="absolute top-8 right-12 w-10 h-4 bg-white border-2 border-black rounded-full"></div>
    </div>
  );

  // MURAL 5: RELOJ MONUMENTAL - El que ya existe
  const RelojMonumental = () => (
    <div className="w-full h-full relative overflow-hidden bg-[#F7F7F7]">
      {/* Fondo dividido - cielo y base */}
      <div className="absolute top-0 left-0 w-full h-2/3 bg-[#FFB22C]"></div>
      <div className="absolute bottom-0 left-0 w-full h-1/3 bg-[#854836]"></div>

      {/* Torre central - estructura vertical principal */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-4/5 bg-[#854836] border-4 border-black shadow-[6px_0px_0px_0px_rgba(0,0,0,1)]"></div>

      {/* Sección superior de la torre */}
      <div className="absolute bottom-2/3 left-1/2 -translate-x-1/2 w-10 h-8 bg-[#FFB22C] border-4 border-black"></div>

      {/* Reloj circular principal - elemento dominante */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-10"></div>

      {/* Anillo interior del reloj */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-[50%] translate-y-[7px] w-12 h-12 rounded-full border-2 border-[#854836] z-10"></div>

      {/* Centro del reloj - mecanismo */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-[50%] translate-y-[7px] w-3 h-3 rounded-full bg-[#FF0000] border-2 border-black z-20"></div>

      {/* Manecilla de hora - gruesa */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-[50%] translate-y-[7px] w-1 h-5 bg-black origin-bottom transform -rotate-45 z-15" style={{ transformOrigin: '50% 100%' }}></div>

      {/* Manecilla de minutos - delgada */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-[50%] translate-y-[7px] w-0.5 h-7 bg-black origin-bottom transform rotate-90 z-15" style={{ transformOrigin: '50% 100%' }}></div>

      {/* Marcadores de hora - 12, 3, 6, 9 */}
      <div className="absolute top-[calc(33.33%-28px)] left-1/2 -translate-x-1/2 w-0.5 h-2 bg-black z-10"></div>
      <div className="absolute top-1/3 -translate-y-1/2 left-[calc(50%+28px)] w-2 h-0.5 bg-black z-10"></div>
      <div className="absolute top-[calc(33.33%+28px)] left-1/2 -translate-x-1/2 w-0.5 h-2 bg-black z-10"></div>
      <div className="absolute top-1/3 -translate-y-1/2 left-[calc(50%-28px)] w-2 h-0.5 bg-black z-10"></div>

      {/* Ventanas de la torre - patrón vertical */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-2 h-3 bg-black border border-[#FFB22C]"></div>
      <div className="absolute bottom-13 left-1/2 -translate-x-1/2 w-2 h-3 bg-black border border-[#FFB22C]"></div>

      {/* Cúpula/techo - triángulo superior */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-0 h-0
        border-l-[20px] border-l-transparent
        border-r-[20px] border-r-transparent
        border-b-[15px] border-b-black z-20"></div>

      {/* Detalles arquitectónicos - pilares laterales */}
      <div className="absolute bottom-0 left-[calc(50%-20px)] w-1.5 h-2/3 bg-black opacity-40"></div>
      <div className="absolute bottom-0 left-[calc(50%+18.5px)] w-1.5 h-2/3 bg-black opacity-40"></div>

      {/* Base/pedestal - estructura inferior */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-6 bg-[#854836] border-4 border-black border-b-0"></div>

      {/* Escalones del pedestal */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-14 h-1 bg-black"></div>
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 w-16 h-1 bg-black opacity-60"></div>

      {/* Elementos decorativos - cuadrados esquinas */}
      <div className="absolute top-1 left-1 w-2 h-2 bg-[#FF0000] border border-black transform rotate-45"></div>
      <div className="absolute top-1 right-1 w-2 h-2 bg-[#FF0000] border border-black transform rotate-45"></div>

      {/* Círculos de acento - elementos brutalist */}
      <div className="absolute top-1/2 left-3 w-3 h-3 rounded-full bg-white border-2 border-black"></div>
      <div className="absolute top-1/2 right-3 w-3 h-3 rounded-full bg-white border-2 border-black"></div>

      {/* Rectángulo flotante - sombra arquitectónica */}
      <div className="absolute top-5 right-5 w-5 h-8 bg-[#FFB22C] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform rotate-12 opacity-80"></div>

      {/* Patrón de líneas sutiles - textura */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, #000 0, #000 1px, transparent 1px, transparent 8px)'
      }}></div>
    </div>
  );

  const murales = [EstadioHidalgo, PisoBenGurion, TeatroBenGurion, CerroDeCubitos, RelojMonumental];
  const MuralComponent = murales[muralIndex];

  return (
    <div className={`relative bg-[#F7F7F7] ${finalClassName}`}>
      <MuralComponent />
    </div>
  );
}
