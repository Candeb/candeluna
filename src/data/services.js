export const services = [
  {
    slug: 'landing-pages',
    title: 'Presencia digital',
    summary:
      'Tu negocio no cierra cuando cerras la puerta. Tu presencia digital sigue trabajando por vos.',
  },
  {
    slug: 'automatizacion',
    title: 'Procesos inteligentes',
    summary:
      'Flujos inteligentes que eliminan tareas repetitivas y liberan tiempo para lo que importa.',
  },
  {
    slug: 'integracion-apis',
    title: 'Integraciones',
    summary:
      'Sistemas que hablan entre sí: datos sincronizados, menos fricción y procesos unificados.',
  },
  {
    slug: 'desarrollo-a-medida',
    title: 'Desarrollo a medida',
    summary:
      'Soluciones web hechas para tu negocio, desde la idea hasta un producto escalable.',
  },
  
]

export function getServiceBySlug(slug) {
  return services.find((service) => service.slug === slug)
}
