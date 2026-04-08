const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  const senhaHash = await bcrypt.hash('admin123', 12);
  const senhaClienteHash = await bcrypt.hash('cliente123', 12);

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@gerobras.com' },
    update: {},
    create: {
      nome: 'Administrador',
      email: 'admin@gerobras.com',
      senhaHash,
      role: 'ADMIN',
    },
  });

  const cliente = await prisma.usuario.upsert({
    where: { email: 'cliente@gerobras.com' },
    update: {},
    create: {
      nome: 'João Silva',
      email: 'cliente@gerobras.com',
      senhaHash: senhaClienteHash,
      role: 'CLIENTE',
    },
  });

  const obra = await prisma.obra.upsert({
    where: { id: 'seed-obra-001' },
    update: {},
    create: {
      id: 'seed-obra-001',
      nome: 'Residência Silva',
      endereco: 'Rua das Flores, 123, São Paulo - SP',
      descricao: 'Construção de residência unifamiliar com 3 quartos',
      status: 'EM_ANDAMENTO',
      dataInicio: new Date('2025-01-10'),
      dataPrevisaoFim: new Date('2025-12-31'),
      orcamentoPrevisto: 350000,
      clienteId: cliente.id,
      etapas: {
        create: [
          { nome: 'Fundação', ordem: 1, percentualPrev: 15, percentualReal: 100, dataInicio: new Date('2025-01-10'), dataFim: new Date('2025-03-15') },
          { nome: 'Estrutura', ordem: 2, percentualPrev: 25, percentualReal: 80, dataInicio: new Date('2025-03-16') },
          { nome: 'Alvenaria', ordem: 3, percentualPrev: 20, percentualReal: 30, dataInicio: new Date('2025-06-01') },
          { nome: 'Cobertura', ordem: 4, percentualPrev: 15, percentualReal: 0 },
          { nome: 'Instalações', ordem: 5, percentualPrev: 15, percentualReal: 0 },
          { nome: 'Acabamento', ordem: 6, percentualPrev: 10, percentualReal: 0 },
        ],
      },
    },
  });

  console.log('✅ Seed concluído!');
  console.log(`   Admin: admin@gerobras.com / admin123`);
  console.log(`   Cliente: cliente@gerobras.com / cliente123`);
  console.log(`   Obra demo criada: ${obra.nome}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
