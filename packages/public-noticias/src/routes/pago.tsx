import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/pago')({
  component: PagoPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      plan: (search.plan as string) || 'basico',
    }
  },
})

function PagoPage() {
  const { plan } = Route.useSearch()
  const [step, setStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('card')

  const planInfo = {
    basico: {
      nombre: 'BÁSICO',
      precio: '$50',
      descripcion: 'ACCESO COMPLETO SIN RESTRICCIONES',
      color: '#FFB22C'
    },
    premium: {
      nombre: 'PREMIUM',
      precio: '$200',
      descripcion: 'CONVIÉRTETE EN PARTE DE LA REDACCIÓN',
      color: '#854836'
    }
  }

  const currentPlan = planInfo[plan as keyof typeof planInfo] || planInfo.basico

  const handlePayment = () => {
    setIsProcessing(true)
    // Simulate payment processing
    setTimeout(() => {
      setStep(3)
      setIsProcessing(false)
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* 🏗️ BRUTALIST HEADER SIMPLIFICADO */}
      <header className="bg-white border-b-4 border-black relative">
        <div className="px-4 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
              {/* Logo */}
              <Link to="/" className="flex items-center justify-center md:justify-start space-x-2 md:space-x-4 relative">
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-[#FF0000] transform rotate-45"></div>
                <h1 className="text-xl md:text-2xl font-black uppercase tracking-[0.1em] text-black">
                  NOTICIAS
                </h1>
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-[0.1em] text-[#854836]">
                  PACHUCA
                </h2>
                <div className="w-6 md:w-8 h-1 bg-[#FFB22C]"></div>
              </Link>

              {/* Progress Indicator */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 border-2 border-black flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-[#854836] text-white' : 'bg-white text-black'}`}>
                    1
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-black hidden md:block">PLAN</span>
                </div>
                <div className="w-8 h-1 bg-black"></div>
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 border-2 border-black flex items-center justify-center font-bold text-sm ${step >= 2 ? 'bg-[#854836] text-white' : 'bg-white text-black'}`}>
                    2
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-black hidden md:block">PAGO</span>
                </div>
                <div className="w-8 h-1 bg-black"></div>
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 border-2 border-black flex items-center justify-center font-bold text-sm ${step >= 3 ? 'bg-[#854836] text-white' : 'bg-white text-black'}`}>
                    3
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-black hidden md:block">CONFIRMACIÓN</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column - Plan Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white border-4 border-black p-6 relative sticky top-8">
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-[#FFB22C] transform rotate-45"></div>

              <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-6 border-b-2 border-black pb-2">
                RESUMEN
              </h2>

              <div className="space-y-4">
                <div className="border-2 border-black p-4" style={{ backgroundColor: currentPlan.color }}>
                  <h3 className="text-xl font-black uppercase text-white mb-2">
                    PLAN {currentPlan.nombre}
                  </h3>
                  <p className="text-sm font-bold text-white mb-4">
                    {currentPlan.descripcion}
                  </p>
                  <div className="text-3xl font-black text-white">
                    {currentPlan.precio}/MES
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-bold text-black">SUBTOTAL:</span>
                    <span className="font-bold text-black">{currentPlan.precio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-black">IVA (16%):</span>
                    <span className="font-bold text-black">${plan === 'premium' ? '32' : '8'}</span>
                  </div>
                  <div className="border-t-2 border-black pt-2 flex justify-between">
                    <span className="font-black text-black uppercase">TOTAL:</span>
                    <span className="font-black text-black">${plan === 'premium' ? '232' : '58'}</span>
                  </div>
                </div>

                <div className="bg-[#F7F7F7] border-2 border-black p-4 mt-6">
                  <h4 className="font-black uppercase text-black mb-3">INCLUYE:</h4>
                  <ul className="space-y-1 text-xs">
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-[#854836] transform rotate-45"></div>
                      <span className="font-bold uppercase">FACTURACIÓN AUTOMÁTICA</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-[#854836] transform rotate-45"></div>
                      <span className="font-bold uppercase">CANCELA CUANDO QUIERAS</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-[#854836] transform rotate-45"></div>
                      <span className="font-bold uppercase">SOPORTE 24/7</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="absolute -bottom-3 -right-3 w-0 h-0 border-l-[16px] border-r-[16px] border-b-[16px] border-l-transparent border-r-transparent border-b-black"></div>
            </div>
          </div>

          {/* Right Column - Payment Form */}
          <div className="lg:col-span-2">

            {step === 1 && (
              <div className="bg-white border-4 border-black p-8 relative">
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#FF0000] transform rotate-45"></div>

                <h1 className="text-4xl font-black uppercase tracking-tight text-black mb-8">
                  CONFIRMA TU PLAN
                </h1>

                <div className="space-y-6">
                  <div className="border-2 border-black p-6 bg-[#F7F7F7]">
                    <h3 className="text-xl font-black uppercase text-black mb-4">
                      HAS SELECCIONADO: PLAN {currentPlan.nombre}
                    </h3>
                    <p className="text-sm font-bold text-black mb-4">
                      {currentPlan.descripcion}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black text-black">
                        {currentPlan.precio} MXN/MES
                      </span>
                      <Link
                        to="/planes"
                        className="bg-[#F7F7F7] text-black px-4 py-2 font-bold uppercase text-sm border-2 border-black hover:bg-black hover:text-white transition-colors"
                      >
                        CAMBIAR PLAN
                      </Link>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    className="w-full bg-[#854836] text-white py-4 font-bold uppercase text-lg border-2 border-black hover:bg-[#FF0000] transition-colors relative group"
                  >
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#FFB22C] transform rotate-45 group-hover:bg-white transition-colors"></div>
                    CONTINUAR AL PAGO
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">

                {/* Payment Method Selection */}
                <div className="bg-white border-4 border-black p-8 relative">
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#FF0000] transform rotate-45"></div>

                  <h1 className="text-4xl font-black uppercase tracking-tight text-black mb-8">
                    MÉTODO DE PAGO
                  </h1>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={`p-4 border-2 border-black font-bold uppercase text-sm transition-colors ${
                        paymentMethod === 'card'
                          ? 'bg-[#854836] text-white'
                          : 'bg-white text-black hover:bg-[#F7F7F7]'
                      }`}
                    >
                      TARJETA
                    </button>
                    <button
                      onClick={() => setPaymentMethod('transfer')}
                      className={`p-4 border-2 border-black font-bold uppercase text-sm transition-colors ${
                        paymentMethod === 'transfer'
                          ? 'bg-[#854836] text-white'
                          : 'bg-white text-black hover:bg-[#F7F7F7]'
                      }`}
                    >
                      TRANSFERENCIA
                    </button>
                    <button
                      onClick={() => setPaymentMethod('oxxo')}
                      className={`p-4 border-2 border-black font-bold uppercase text-sm transition-colors ${
                        paymentMethod === 'oxxo'
                          ? 'bg-[#854836] text-white'
                          : 'bg-white text-black hover:bg-[#F7F7F7]'
                      }`}
                    >
                      OXXO
                    </button>
                  </div>

                  {/* Payment Form */}
                  {paymentMethod === 'card' && (
                    <form className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold uppercase tracking-wider text-black mb-3">
                          NÚMERO DE TARJETA
                        </label>
                        <input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          className="w-full px-4 py-4 border-2 border-black bg-[#F7F7F7] font-bold text-sm focus:outline-none focus:bg-white focus:border-[#854836] transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold uppercase tracking-wider text-black mb-3">
                            VENCIMIENTO
                          </label>
                          <input
                            type="text"
                            placeholder="MM/AA"
                            className="w-full px-4 py-4 border-2 border-black bg-[#F7F7F7] font-bold text-sm focus:outline-none focus:bg-white focus:border-[#854836] transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold uppercase tracking-wider text-black mb-3">
                            CVV
                          </label>
                          <input
                            type="text"
                            placeholder="123"
                            className="w-full px-4 py-4 border-2 border-black bg-[#F7F7F7] font-bold text-sm focus:outline-none focus:bg-white focus:border-[#854836] transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold uppercase tracking-wider text-black mb-3">
                          NOMBRE EN LA TARJETA
                        </label>
                        <input
                          type="text"
                          placeholder="JUAN PÉREZ"
                          className="w-full px-4 py-4 border-2 border-black bg-[#F7F7F7] font-bold uppercase text-sm focus:outline-none focus:bg-white focus:border-[#854836] transition-colors"
                        />
                      </div>
                    </form>
                  )}

                  {paymentMethod === 'transfer' && (
                    <div className="bg-[#FFB22C] border-2 border-black p-6">
                      <h3 className="font-black uppercase text-black mb-4">DATOS PARA TRANSFERENCIA:</h3>
                      <div className="space-y-2 text-sm font-bold text-black">
                        <div>BANCO: BBVA BANCOMER</div>
                        <div>CUENTA: 0123456789</div>
                        <div>CLABE: 012345678901234567</div>
                        <div>CONCEPTO: SUSCRIPCIÓN {currentPlan.nombre}</div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'oxxo' && (
                    <div className="bg-[#FFB22C] border-2 border-black p-6">
                      <h3 className="font-black uppercase text-black mb-4">PAGO EN OXXO:</h3>
                      <p className="text-sm font-bold text-black mb-4">
                        SE GENERARÁ UN CÓDIGO DE BARRAS PARA PAGAR EN CUALQUIER TIENDA OXXO.
                      </p>
                      <div className="text-xs font-bold text-black">
                        * EL CÓDIGO EXPIRA EN 72 HORAS
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-4 pt-6">
                    <input type="checkbox" id="terms" required />
                    <label htmlFor="terms" className="text-sm font-bold text-black cursor-pointer">
                      ACEPTO LOS <span className="text-[#854836] underline">TÉRMINOS Y CONDICIONES</span> Y LA <span className="text-[#854836] underline">POLÍTICA DE PRIVACIDAD</span>
                    </label>
                  </div>

                  <div className="flex space-x-4 pt-6">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 bg-[#F7F7F7] text-black py-4 font-bold uppercase text-lg border-2 border-black hover:bg-black hover:text-white transition-colors"
                    >
                      VOLVER
                    </button>
                    <button
                      onClick={handlePayment}
                      disabled={isProcessing}
                      className="flex-1 bg-[#854836] text-white py-4 font-bold uppercase text-lg border-2 border-black hover:bg-[#FF0000] transition-colors relative group disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>PROCESANDO...</span>
                        </div>
                      ) : (
                        <>
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#FFB22C] transform rotate-45 group-hover:bg-white transition-colors"></div>
                          PAGAR AHORA
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Security Info */}
                <div className="bg-[#F7F7F7] border-2 border-black p-6 relative">
                  <div className="absolute -top-1 -left-1 w-4 h-4 bg-[#854836] transform rotate-45"></div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-black border-2 border-black flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                      <h3 className="font-black uppercase text-black text-sm">PAGO 100% SEGURO</h3>
                      <p className="text-xs font-bold text-black">TUS DATOS ESTÁN PROTEGIDOS CON ENCRIPTACIÓN SSL</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white border-4 border-black p-8 relative text-center">
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-[#FFB22C] transform rotate-45"></div>

                {/* Success Animation */}
                <div className="mb-8">
                  <div className="w-24 h-24 bg-[#854836] border-4 border-black mx-auto flex items-center justify-center relative animate-pulse">
                    <div className="text-white text-4xl font-black">✓</div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#FFB22C] transform rotate-45"></div>
                  </div>
                </div>

                <h1 className="text-4xl font-black uppercase tracking-tight text-black mb-6">
                  ¡PAGO EXITOSO!
                </h1>

                <p className="text-xl font-bold text-[#854836] mb-8">
                  BIENVENIDO AL PLAN {currentPlan.nombre}
                </p>

                <div className="bg-[#F7F7F7] border-2 border-black p-6 mb-8">
                  <h3 className="font-black uppercase text-black mb-4">DETALLES DEL PAGO:</h3>
                  <div className="space-y-2 text-sm font-bold text-black">
                    <div className="flex justify-between">
                      <span>PLAN:</span>
                      <span>{currentPlan.nombre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>MONTO:</span>
                      <span>${plan === 'premium' ? '232' : '58'} MXN</span>
                    </div>
                    <div className="flex justify-between">
                      <span>FECHA:</span>
                      <span>{new Date().toLocaleDateString('es-ES')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>PRÓXIMO COBRO:</span>
                      <span>{new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Link
                    to="/perfil"
                    className="block w-full bg-[#854836] text-white py-4 font-bold uppercase text-lg border-2 border-black hover:bg-[#FF0000] transition-colors relative group"
                  >
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#FFB22C] transform rotate-45 group-hover:bg-white transition-colors"></div>
                    IR A MI PERFIL
                  </Link>
                  <Link
                    to="/"
                    className="block w-full bg-white text-black py-4 font-bold uppercase text-lg border-2 border-black hover:bg-black hover:text-white transition-colors"
                  >
                    VOLVER AL INICIO
                  </Link>
                </div>

                <div className="absolute -bottom-3 -right-3 w-0 h-0 border-l-[16px] border-r-[16px] border-b-[16px] border-l-transparent border-r-transparent border-b-black"></div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Footer simplificado */}
      <footer className="bg-black text-white border-t-4 border-[#FFB22C] mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <div className="border-2 border-[#FFB22C] p-4 inline-block relative">
              <div className="absolute -top-2 -left-2 w-4 h-4 bg-[#FF0000] transform rotate-45"></div>
              <h2 className="text-xl font-black uppercase tracking-wider text-[#FFB22C] mb-1">NOTICIAS</h2>
              <h3 className="text-xl font-black uppercase tracking-wider text-white">PACHUCA</h3>
              <div className="w-8 h-1 bg-[#FFB22C] mx-auto mt-2"></div>
            </div>
            <p className="text-sm font-bold uppercase tracking-wider mt-4">
              © 2025 NOTICIAS PACHUCA. TODOS LOS DERECHOS RESERVADOS.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}