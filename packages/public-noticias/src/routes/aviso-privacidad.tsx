import { createFileRoute, Link } from '@tanstack/react-router';
import { Breadcrumbs } from '../components/shared/Breadcrumbs';
import { useState, useEffect } from 'react';

export const Route = createFileRoute('/aviso-privacidad')({
  component: AvisoPrivacidadPage,
  head: () => ({
    meta: [
      { title: 'Aviso de Privacidad - Noticias Pachuca' },
      { name: 'description', content: 'Aviso de privacidad conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.' },
    ],
  }),
});

function AvisoPrivacidadPage() {
  const [activeSection, setActiveSection] = useState('identidad');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['identidad', 'datos', 'finalidades', 'transferencia', 'derechos', 'modificaciones', 'contacto'];
      const scrollPosition = window.scrollY + 200;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const sections = [
    { id: 'identidad', title: 'Identidad del Responsable' },
    { id: 'datos', title: 'Datos Personales que Recabamos' },
    { id: 'finalidades', title: 'Finalidades del Tratamiento' },
    { id: 'transferencia', title: 'Transferencia de Datos' },
    { id: 'derechos', title: 'Derechos ARCO' },
    { id: 'modificaciones', title: 'Modificaciones al Aviso' },
    { id: 'contacto', title: 'Contacto' },
  ];

  const lastUpdated = '6 de octubre de 2025';

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b-8 border-black bg-[#854836] text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs
            items={[
              { label: 'Inicio', href: '/' },
              { label: 'Aviso de Privacidad' },
            ]}
          />

          <div className="flex items-center justify-between flex-wrap gap-4 mt-6">
            <div>
              <h1 className="font-mono text-4xl md:text-5xl font-bold uppercase tracking-tight">
                AVISO DE PRIVACIDAD
              </h1>
              <p className="font-mono text-lg mt-2">
                Última actualización: {lastUpdated}
              </p>
            </div>

            <Link
              to="/"
              className="px-6 py-3 bg-white text-black border-4 border-black font-mono font-bold hover:bg-[#FFB22C] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
            >
              Inicio
            </Link>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="lg:grid lg:grid-cols-4 lg:gap-12">
          {/* Tabla de Contenidos Sticky */}
          <aside className="lg:col-span-1 mb-8 lg:mb-0">
            <div className="lg:sticky lg:top-24">
              <div className="border-4 border-black bg-[#F7F7F7] p-6">
                <h2 className="font-mono text-lg font-bold mb-4 uppercase border-b-2 border-black pb-2">
                  Contenido
                </h2>
                <nav>
                  <ul className="space-y-2">
                    {sections.map((section) => (
                      <li key={section.id}>
                        <button
                          onClick={() => scrollToSection(section.id)}
                          className={`text-left w-full text-sm font-mono hover:underline transition-colors ${
                            activeSection === section.id
                              ? 'font-bold text-black'
                              : 'text-gray-600'
                          }`}
                        >
                          {section.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </div>
          </aside>

          {/* Contenido Principal */}
          <main className="lg:col-span-3">
            <div className="prose max-w-none">
              {/* Intro */}
              <div className="border-4 border-black bg-white p-8 mb-8">
                <p className="text-lg leading-relaxed mb-4">
                  En cumplimiento de la <strong>Ley Federal de Protección de Datos Personales en Posesión de los Particulares</strong> (LFPDPPP),
                  su Reglamento y los Lineamientos del Aviso de Privacidad, Noticias Pachuca pone a su disposición el presente Aviso de Privacidad.
                </p>
                <p className="text-base text-gray-700 leading-relaxed">
                  Este documento describe cómo recopilamos, utilizamos, almacenamos y protegemos sus datos personales
                  cuando usted voluntariamente los proporciona a través de nuestros servicios digitales.
                </p>
              </div>

              {/* Sección 1: Identidad */}
              <section id="identidad" className="border-4 border-black bg-white p-8 mb-8">
                <h2 className="font-mono text-2xl md:text-3xl font-bold mb-6 uppercase border-b-4 border-black pb-4">
                  1. IDENTIDAD Y DOMICILIO DEL RESPONSABLE
                </h2>

                <div className="space-y-4 text-base leading-relaxed">
                  <p>
                    <strong>Noticias Pachuca</strong> (en adelante, el "Responsable") es el responsable del tratamiento
                    de sus datos personales.
                  </p>

                  <div className="border-l-4 border-black pl-4 bg-[#F7F7F7] p-4">
                    <p className="font-mono"><strong>Denominación:</strong> Noticias Pachuca</p>
                    <p className="font-mono"><strong>Domicilio:</strong> Pachuca de Soto, Hidalgo, México</p>
                    <p className="font-mono"><strong>Sitio web:</strong> noticiaspachuca.com</p>
                  </div>

                  <p>
                    Para cualquier cuestión relacionada con el tratamiento de sus datos personales,
                    puede contactarnos a través de la información proporcionada en la sección de Contacto.
                  </p>
                </div>
              </section>

              {/* Sección 2: Datos que Recabamos */}
              <section id="datos" className="border-4 border-black bg-white p-8 mb-8">
                <h2 className="font-mono text-2xl md:text-3xl font-bold mb-6 uppercase border-b-4 border-black pb-4">
                  2. DATOS PERSONALES QUE RECABAMOS
                </h2>

                <div className="space-y-6 text-base leading-relaxed">
                  <p>
                    Únicamente recabamos datos personales que usted <strong>proporciona de manera voluntaria</strong> a
                    través de los siguientes medios:
                  </p>

                  {/* Formulario de Contacto */}
                  <div className="border-2 border-black p-6 bg-[#F7F7F7]">
                    <h3 className="font-mono text-lg font-bold mb-3 uppercase">
                      A. Formulario de Contacto
                    </h3>
                    <p className="mb-3">
                      Cuando usted utiliza nuestro formulario de contacto para comunicarse con nosotros,
                      recabamos los siguientes datos:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Nombre completo</li>
                      <li>Correo electrónico</li>
                      <li>Teléfono (opcional)</li>
                      <li>Mensaje o consulta</li>
                    </ul>
                  </div>

                  {/* Suscripción a Boletines */}
                  <div className="border-2 border-black p-6 bg-[#F7F7F7]">
                    <h3 className="font-mono text-lg font-bold mb-3 uppercase">
                      B. Suscripción a Boletines Informativos
                    </h3>
                    <p className="mb-3">
                      Cuando usted se suscribe voluntariamente a nuestros boletines informativos, recabamos:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Correo electrónico</li>
                      <li>Preferencias de boletines (mañana, tarde, semanal, deportes)</li>
                      <li>Fecha y hora de suscripción</li>
                      <li>Dirección IP (para fines de seguridad)</li>
                    </ul>
                  </div>

                  {/* Datos Automáticos */}
                  <div className="border-2 border-black p-6 bg-[#F7F7F7]">
                    <h3 className="font-mono text-lg font-bold mb-3 uppercase">
                      C. Datos de Navegación
                    </h3>
                    <p className="mb-3">
                      De manera automática, nuestro sitio web puede recopilar ciertos datos técnicos
                      que no son considerados datos personales sensibles:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Dirección IP</li>
                      <li>Tipo de navegador y dispositivo</li>
                      <li>Sistema operativo</li>
                      <li>Páginas visitadas y tiempo de navegación</li>
                      <li>Fuente de referencia (sitio desde el cual llegó a nosotros)</li>
                    </ul>
                    <p className="mt-3 text-sm text-gray-700">
                      Estos datos se utilizan exclusivamente para mejorar la experiencia de usuario,
                      seguridad del sitio y estadísticas agregadas.
                    </p>
                  </div>

                  <div className="border-4 border-[#FFB22C] bg-[#FFB22C] bg-opacity-10 p-6">
                    <p className="font-mono font-bold mb-2">IMPORTANTE:</p>
                    <p>
                      <strong>NO</strong> recabamos datos personales sensibles como origen racial o étnico,
                      estado de salud, información genética, creencias religiosas, filosóficas o morales,
                      afiliación sindical, opiniones políticas, ni preferencia sexual.
                    </p>
                  </div>
                </div>
              </section>

              {/* Sección 3: Finalidades */}
              <section id="finalidades" className="border-4 border-black bg-white p-8 mb-8">
                <h2 className="font-mono text-2xl md:text-3xl font-bold mb-6 uppercase border-b-4 border-black pb-4">
                  3. FINALIDADES DEL TRATAMIENTO
                </h2>

                <div className="space-y-6 text-base leading-relaxed">
                  <p>
                    Los datos personales que recabamos serán tratados para las siguientes finalidades:
                  </p>

                  {/* Finalidades Primarias */}
                  <div className="border-2 border-black p-6 bg-white">
                    <h3 className="font-mono text-lg font-bold mb-4 uppercase">
                      FINALIDADES PRIMARIAS (Necesarias para el servicio)
                    </h3>
                    <ul className="list-decimal list-inside space-y-3 ml-4">
                      <li>
                        <strong>Atender sus solicitudes de contacto:</strong> Responder sus preguntas,
                        comentarios o consultas enviadas a través de nuestro formulario de contacto.
                      </li>
                      <li>
                        <strong>Envío de boletines informativos:</strong> Enviarle por correo electrónico
                        los boletines noticiosos a los cuales se haya suscrito voluntariamente.
                      </li>
                      <li>
                        <strong>Gestión de suscripciones:</strong> Administrar su suscripción, preferencias,
                        confirmación de registro y solicitudes de baja.
                      </li>
                      <li>
                        <strong>Seguridad y prevención de fraudes:</strong> Proteger la integridad de nuestros
                        sistemas y prevenir actividades fraudulentas o no autorizadas.
                      </li>
                    </ul>
                  </div>

                  {/* Finalidades Secundarias */}
                  <div className="border-2 border-black p-6 bg-[#F7F7F7]">
                    <h3 className="font-mono text-lg font-bold mb-4 uppercase">
                      FINALIDADES SECUNDARIAS (Opcionales)
                    </h3>
                    <ul className="list-decimal list-inside space-y-3 ml-4">
                      <li>
                        <strong>Mejora de nuestros servicios:</strong> Analizar estadísticas de uso del sitio
                        web para mejorar la experiencia de usuario y contenido editorial.
                      </li>
                      <li>
                        <strong>Comunicaciones promocionales:</strong> Enviarle información sobre nuevos servicios,
                        funcionalidades o cambios relevantes en nuestro sitio.
                      </li>
                    </ul>
                    <p className="mt-4 text-sm">
                      <strong>Si usted no desea que sus datos personales sean tratados para estas finalidades secundarias,
                      puede manifestarlo contactándonos.</strong> La negativa para el tratamiento de finalidades secundarias
                      no será motivo para negarle el acceso a nuestros servicios.
                    </p>
                  </div>
                </div>
              </section>

              {/* Sección 4: Transferencia */}
              <section id="transferencia" className="border-4 border-black bg-white p-8 mb-8">
                <h2 className="font-mono text-2xl md:text-3xl font-bold mb-6 uppercase border-b-4 border-black pb-4">
                  4. TRANSFERENCIA DE DATOS PERSONALES
                </h2>

                <div className="space-y-4 text-base leading-relaxed">
                  <p>
                    Sus datos personales <strong>NO serán transferidos, compartidos, vendidos o divulgados</strong> a
                    terceros, salvo en los siguientes casos excepcionales:
                  </p>

                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      <strong>Proveedores de servicios:</strong> Únicamente compartimos datos con proveedores tecnológicos
                      necesarios para operar nuestros servicios (por ejemplo, servicios de hosting, envío de correos electrónicos).
                      Estos proveedores están obligados contractualmente a mantener la confidencialidad de sus datos.
                    </li>
                    <li>
                      <strong>Requerimientos legales:</strong> Cuando sea requerido por autoridades competentes en cumplimiento
                      de leyes, regulaciones, procesos judiciales o solicitudes gubernamentales aplicables.
                    </li>
                    <li>
                      <strong>Con su consentimiento expreso:</strong> En cualquier otro caso que requiera su autorización previa.
                    </li>
                  </ul>

                  <div className="border-4 border-black bg-white p-6 mt-6">
                    <p className="font-mono font-bold mb-2">GARANTÍA DE CONFIDENCIALIDAD:</p>
                    <p>
                      Noticias Pachuca se compromete a mantener la confidencialidad de sus datos personales y
                      garantiza que ha implementado medidas de seguridad administrativas, técnicas y físicas
                      para proteger sus datos contra daño, pérdida, alteración, destrucción o uso no autorizado.
                    </p>
                  </div>
                </div>
              </section>

              {/* Sección 5: Derechos ARCO */}
              <section id="derechos" className="border-4 border-black bg-white p-8 mb-8">
                <h2 className="font-mono text-2xl md:text-3xl font-bold mb-6 uppercase border-b-4 border-black pb-4">
                  5. DERECHOS ARCO
                </h2>

                <div className="space-y-6 text-base leading-relaxed">
                  <p>
                    Usted tiene derecho a conocer qué datos personales tenemos de usted, para qué los utilizamos
                    y las condiciones del uso que les damos (Acceso). Asimismo, es su derecho solicitar la corrección
                    de su información personal en caso de que esté desactualizada, sea inexacta o incompleta (Rectificación);
                    que la eliminemos de nuestros registros o bases de datos cuando considere que la misma no está siendo
                    utilizada conforme a los principios, deberes y obligaciones previstas en la normativa (Cancelación);
                    así como oponerse al uso de sus datos personales para fines específicos (Oposición).
                    Estos derechos se conocen como derechos ARCO.
                  </p>

                  {/* Cómo Ejercer Derechos */}
                  <div className="border-2 border-black p-6 bg-[#F7F7F7]">
                    <h3 className="font-mono text-lg font-bold mb-4 uppercase">
                      CÓMO EJERCER SUS DERECHOS ARCO
                    </h3>
                    <p className="mb-4">
                      Para ejercer sus derechos ARCO, debe enviar una solicitud al correo electrónico
                      proporcionado en la sección de Contacto, incluyendo:
                    </p>
                    <ul className="list-decimal list-inside space-y-2 ml-4">
                      <li>Nombre completo del titular</li>
                      <li>Correo electrónico para recibir respuesta</li>
                      <li>Descripción clara del derecho que desea ejercer (Acceso, Rectificación, Cancelación u Oposición)</li>
                      <li>Documentos que acrediten su identidad (copia de identificación oficial)</li>
                      <li>Cualquier documento o información que facilite la localización de sus datos</li>
                    </ul>
                    <p className="mt-4">
                      <strong>Plazo de respuesta:</strong> Tendremos un plazo máximo de <strong>20 días hábiles</strong> para
                      atender su solicitud y le informaremos sobre la procedencia de la misma.
                    </p>
                  </div>

                  {/* Revocación de Consentimiento */}
                  <div className="border-2 border-black p-6 bg-white">
                    <h3 className="font-mono text-lg font-bold mb-4 uppercase">
                      REVOCACIÓN DEL CONSENTIMIENTO
                    </h3>
                    <p className="mb-4">
                      Usted puede revocar el consentimiento que nos ha otorgado para el tratamiento de sus datos
                      personales en cualquier momento. Para ello:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>
                        <strong>Para boletines:</strong> Puede darse de baja haciendo clic en el enlace "Desuscribirse"
                        que aparece en cada email, o contactándonos directamente.
                      </li>
                      <li>
                        <strong>Para otros datos:</strong> Envíe una solicitud siguiendo el procedimiento de derechos ARCO.
                      </li>
                    </ul>
                  </div>

                  {/* Limitación de Uso */}
                  <div className="border-2 border-black p-6 bg-[#F7F7F7]">
                    <h3 className="font-mono text-lg font-bold mb-4 uppercase">
                      LIMITACIÓN DE USO Y DIVULGACIÓN
                    </h3>
                    <p>
                      Puede limitar el uso o divulgación de sus datos personales enviándonos una solicitud.
                      Le informaremos si su solicitud procede y, en su caso, contará con un plazo de 5 días
                      hábiles para que se haga efectiva.
                    </p>
                  </div>
                </div>
              </section>

              {/* Sección 6: Modificaciones */}
              <section id="modificaciones" className="border-4 border-black bg-white p-8 mb-8">
                <h2 className="font-mono text-2xl md:text-3xl font-bold mb-6 uppercase border-b-4 border-black pb-4">
                  6. MODIFICACIONES AL AVISO DE PRIVACIDAD
                </h2>

                <div className="space-y-4 text-base leading-relaxed">
                  <p>
                    El presente Aviso de Privacidad puede sufrir modificaciones, cambios o actualizaciones derivadas
                    de nuevos requerimientos legales, necesidades propias del servicio, o nuestras prácticas de
                    tratamiento de datos.
                  </p>

                  <p>
                    Nos comprometemos a mantenerlo informado sobre los cambios que pueda sufrir el presente
                    Aviso de Privacidad a través de:
                  </p>

                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Publicación en nuestro sitio web: <strong>noticiaspachuca.com/aviso-privacidad</strong></li>
                    <li>Notificación por correo electrónico (para usuarios suscritos)</li>
                    <li>Avisos en nuestras plataformas digitales</li>
                  </ul>

                  <div className="border-2 border-black p-6 bg-[#F7F7F7] mt-6">
                    <p className="font-mono text-sm">
                      <strong>ÚLTIMA ACTUALIZACIÓN:</strong> {lastUpdated}
                    </p>
                  </div>
                </div>
              </section>

              {/* Sección 7: Contacto */}
              <section id="contacto" className="border-4 border-black bg-white p-8 mb-8">
                <h2 className="font-mono text-2xl md:text-3xl font-bold mb-6 uppercase border-b-4 border-black pb-4">
                  7. CONTACTO Y ATENCIÓN DE SOLICITUDES
                </h2>

                <div className="space-y-4 text-base leading-relaxed">
                  <p>
                    Si tiene alguna duda, comentario o desea ejercer sus derechos ARCO, puede contactarnos a través de:
                  </p>

                  <div className="border-2 border-black p-6 bg-[#F7F7F7]">
                    <div className="space-y-3 font-mono">
                      <p><strong>EMAIL:</strong> contacto@noticiaspachuca.com</p>
                      <p><strong>SITIO WEB:</strong> noticiaspachuca.com/contacto</p>
                      <p><strong>HORARIO DE ATENCIÓN:</strong> Lunes a viernes, 9:00 AM - 6:00 PM (Hora del Centro de México)</p>
                    </div>
                  </div>

                  <p className="mt-6">
                    Asimismo, le informamos que tiene el derecho de acudir ante el <strong>Instituto Nacional de
                    Transparencia, Acceso a la Información y Protección de Datos Personales (INAI)</strong> para
                    cualquier inconformidad relacionada con el tratamiento de sus datos personales.
                  </p>

                  <div className="border-2 border-black p-6 bg-white mt-4">
                    <p className="font-mono text-sm mb-2"><strong>INAI - Instituto Nacional de Transparencia</strong></p>
                    <p className="text-sm">Sitio web: <a href="https://home.inai.org.mx" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#FF0000]">home.inai.org.mx</a></p>
                    <p className="text-sm">Teléfono: 800 835 43 24</p>
                  </div>
                </div>
              </section>

              {/* Aceptación */}
              <div className="border-8 border-black bg-[#854836] text-white p-8 text-center">
                <h3 className="font-mono text-2xl font-bold mb-4 uppercase">
                  CONSENTIMIENTO
                </h3>
                <p className="text-lg leading-relaxed">
                  Al proporcionar sus datos personales a través de nuestros formularios o servicios,
                  usted acepta y consiente el tratamiento de los mismos conforme al presente Aviso de Privacidad.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
