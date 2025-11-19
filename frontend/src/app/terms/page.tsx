export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto p-6 py-12">
      <h1 className="text-4xl font-bold text-white mb-8">Términos de Servicio</h1>

      <div className="bg-dark-800 rounded-lg p-8 space-y-6 text-dark-200">
        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">1. Aceptación de Términos</h2>
          <p>
            Al acceder y usar AnimeShorts, aceptas estar legalmente vinculado por estos Términos de Servicio.
            Si no aceptas estos términos, no uses el servicio.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">2. Requisitos de Edad</h2>
          <p className="mb-3">
            <strong>AnimeShorts es exclusivamente para usuarios mayores de 18 años.</strong> Al usar el servicio, declaras y garantizas que:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Tienes al menos 18 años de edad</li>
            <li>Tienes capacidad legal para aceptar estos términos</li>
            <li>No estás prohibido de usar el servicio bajo las leyes aplicables</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">3. Contenido del Usuario</h2>
          <h3 className="text-lg font-semibold text-white mb-2">3.1 Responsabilidad del Contenido</h3>
          <p className="mb-3">Eres responsable del contenido que subes. Al subir contenido, garantizas que:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Posees todos los derechos necesarios sobre el contenido</li>
            <li>El contenido no infringe derechos de propiedad intelectual de terceros</li>
            <li>El contenido cumple con todas las leyes aplicables</li>
            <li>Todo el contenido es ficción y no representa menores de edad</li>
          </ul>

          <h3 className="text-lg font-semibold text-white mb-2 mt-4">3.2 Contenido Prohibido</h3>
          <p className="mb-3">Está estrictamente prohibido subir:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Contenido que represente o sugiera menores de edad</li>
            <li>Contenido ilegal en cualquier jurisdicción</li>
            <li>Contenido violento extremo o gore real</li>
            <li>Contenido que promueva odio, discriminación o violencia</li>
            <li>Información personal de terceros sin consentimiento</li>
            <li>Spam, malware o contenido engañoso</li>
          </ul>

          <h3 className="text-lg font-semibold text-white mb-2 mt-4">3.3 Licencia de Contenido</h3>
          <p>
            Al subir contenido, otorgas a AnimeShorts una licencia mundial, no exclusiva, libre de regalías para usar,
            reproducir, distribuir, y mostrar tu contenido en relación con el servicio.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">4. Conducta del Usuario</h2>
          <p className="mb-3">Aceptas NO:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Acosar, intimidar o amenazar a otros usuarios</li>
            <li>Hacer spam o usar el servicio para propósitos comerciales no autorizados</li>
            <li>Intentar acceder a cuentas de otros usuarios</li>
            <li>Interferir con la seguridad o funcionamiento del servicio</li>
            <li>Usar bots, scrapers o herramientas automatizadas sin permiso</li>
            <li>Eludir restricciones de edad o geográficas</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">5. Moderación y Eliminación de Contenido</h2>
          <p>
            Nos reservamos el derecho de revisar, moderar, y eliminar cualquier contenido que viole estos términos.
            También podemos suspender o terminar cuentas sin previo aviso si determinamos violación de términos.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">6. Propiedad Intelectual</h2>
          <p>
            AnimeShorts, su logo, y todos los materiales relacionados son propiedad de AnimeShorts o sus licenciantes.
            No puedes usar nuestras marcas comerciales sin permiso escrito.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">7. DMCA y Derechos de Autor</h2>
          <p className="mb-3">
            Respetamos los derechos de propiedad intelectual. Si crees que tu trabajo ha sido infringido:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Email: dmca@animeshorts.com</li>
            <li>Incluye: descripción del trabajo, ubicación del contenido infractor, tu información de contacto</li>
            <li>Procesaremos avisos DMCA válidos según la ley aplicable</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">8. Suscripciones y Pagos</h2>
          <h3 className="text-lg font-semibold text-white mb-2">8.1 Suscripciones Premium</h3>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Las suscripciones se renuevan automáticamente</li>
            <li>Puedes cancelar en cualquier momento desde tu dashboard</li>
            <li>No se ofrecen reembolsos excepto en los primeros 7 días</li>
            <li>Los precios pueden cambiar con aviso de 30 días</li>
          </ul>

          <h3 className="text-lg font-semibold text-white mb-2 mt-4">8.2 Donaciones</h3>
          <p>
            Las donaciones a creadores son finales y no reembolsables. No somos responsables por disputas entre usuarios y creadores.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">9. Limitación de Responsabilidad</h2>
          <p>
            EL SERVICIO SE PROPORCIONA "TAL CUAL" SIN GARANTÍAS. NO SOMOS RESPONSABLES POR DAÑOS INDIRECTOS,
            INCIDENTALES, O CONSECUENTES. NUESTRA RESPONSABILIDAD ESTÁ LIMITADA AL MONTO QUE PAGASTE EN LOS ÚLTIMOS 12 MESES.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">10. Terminación</h2>
          <p>
            Podemos terminar o suspender tu cuenta inmediatamente por violación de estos términos. Puedes eliminar tu
            cuenta en cualquier momento desde la configuración.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">11. Cambios a los Términos</h2>
          <p>
            Podemos modificar estos términos en cualquier momento. Cambios significativos serán notificados por email.
            El uso continuado después de cambios constituye aceptación.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">12. Ley Aplicable</h2>
          <p>
            Estos términos se rigen por las leyes del país donde opera AnimeShorts. Cualquier disputa se resolverá
            mediante arbitraje vinculante.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">13. Contacto</h2>
          <p>
            Para preguntas sobre estos términos:<br />
            Email: legal@animeshorts.com<br />
            Última actualización: Noviembre 2024
          </p>
        </section>
      </div>
    </div>
  );
}
