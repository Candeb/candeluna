export const services = [
  {
    slug: 'landing-pages',
    title: 'Presencia digital',
    tag: 'Captar',
    summary:
      'Páginas enfocadas en conversión, con narrativa clara y diseño que convierte visitas en oportunidades.',
  },
  {
    slug: 'automatizacion',
    title: 'Procesos inteligentes',
    tag: 'Optimizar',
    summary:
      'Flujos inteligentes que eliminan tareas repetitivas y liberan tiempo para lo que importa.',
  },
  {
    slug: 'integracion-apis',
    title: 'Integraciones',
    tag: 'Conectar',
    summary:
      'Sistemas que hablan entre sí: datos sincronizados, menos fricción y procesos unificados.',
  },
  {
    slug: 'desarrollo-a-medida',
    title: 'Desarrollo a medida',
    tag: 'Construir',
    summary:
      'Soluciones web hechas para tu negocio, desde la idea hasta un producto escalable.',
  },
  
  {
    slug: 'contacto',
    title: 'Contacto',
    tag: 'Iniciar',
    summary:
      'Agendemos una llamada o pedí presupuesto. El primer paso de tu próximo proyecto.',
  },
]

export function getServiceBySlug(slug) {
  return services.find((service) => service.slug === slug)
}
