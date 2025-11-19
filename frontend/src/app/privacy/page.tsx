export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 py-12">
      <h1 className="text-4xl font-bold text-white mb-8">Política de Privacidad</h1>

      <div className="bg-dark-800 rounded-lg p-8 space-y-6 text-dark-200">
        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">1. Información que Recopilamos</h2>
          <p className="mb-3">Recopilamos la siguiente información cuando utilizas AnimeShorts:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Información de cuenta (nombre de usuario, email, contraseña encriptada)</li>
            <li>Información de perfil (nombre para mostrar, biografía, avatar)</li>
            <li>Contenido que subes (videos, comentarios, likes)</li>
            <li>Información de uso (videos vistos, historial de navegación)</li>
            <li>Información técnica (dirección IP, tipo de navegador, dispositivo)</li>
            <li>Información de pago (procesada por Stripe, no almacenamos datos de tarjeta)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">2. Cómo Usamos tu Información</h2>
          <p className="mb-3">Utilizamos tu información para:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Proporcionar y mantener nuestros servicios</li>
            <li>Personalizar tu experiencia y recomendaciones</li>
            <li>Procesar transacciones y suscripciones</li>
            <li>Enviarte notificaciones importantes</li>
            <li>Mejorar la seguridad y prevenir fraudes</li>
            <li>Cumplir con obligaciones legales</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">3. Compartir Información</h2>
          <p className="mb-3">No vendemos tu información personal. Podemos compartir información con:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Proveedores de servicios (hosting, procesamiento de pagos, análisis)</li>
            <li>Autoridades legales cuando sea requerido por ley</li>
            <li>Otros usuarios (información de perfil público, contenido publicado)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">4. Tus Derechos (GDPR)</h2>
          <p className="mb-3">Bajo el GDPR, tienes derecho a:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Acceder a tus datos personales</li>
            <li>Rectificar información incorrecta</li>
            <li>Eliminar tus datos (derecho al olvido)</li>
            <li>Restringir el procesamiento de tus datos</li>
            <li>Portabilidad de datos</li>
            <li>Oponerte al procesamiento</li>
            <li>Retirar consentimiento en cualquier momento</li>
          </ul>
          <p className="mt-3">Para ejercer estos derechos, contáctanos en privacy@animeshorts.com</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">5. Cookies</h2>
          <p>
            Utilizamos cookies necesarias, funcionales, de análisis y marketing. Puedes gestionar tus preferencias de cookies en cualquier momento.
            Las cookies necesarias son esenciales para el funcionamiento del sitio y no pueden ser desactivadas.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">6. Seguridad</h2>
          <p>
            Implementamos medidas de seguridad técnicas y organizativas para proteger tu información, incluyendo:
            encriptación de datos, autenticación de dos factores opcional, auditorías de seguridad regulares, y
            controles de acceso estrictos.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">7. Retención de Datos</h2>
          <p>
            Retenemos tu información mientras tu cuenta esté activa o según sea necesario para proporcionarte servicios.
            Los datos financieros se retienen durante 7 años por requisitos legales. Puedes solicitar la eliminación de
            tu cuenta y datos en cualquier momento.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">8. Contenido para Adultos</h2>
          <p>
            AnimeShorts aloja contenido para adultos (+18). Verificamos la edad durante el registro. Al usar el sitio,
            confirmas que tienes al menos 18 años. No recopilamos intencionalmente información de menores de edad.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">9. Cambios a esta Política</h2>
          <p>
            Podemos actualizar esta política ocasionalmente. Te notificaremos de cambios significativos por email o
            mediante un aviso en el sitio. El uso continuado del servicio después de cambios constituye aceptación.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">10. Contacto</h2>
          <p>
            Para preguntas sobre privacidad o para ejercer tus derechos:<br />
            Email: privacy@animeshorts.com<br />
            Última actualización: Noviembre 2024
          </p>
        </section>
      </div>
    </div>
  );
}
