const admin = require('firebase-admin');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Inicializa Firebase Admin apenas se as variáveis estiverem configuradas
let firebaseInitialized = false;
if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
  firebaseInitialized = true;
}

const criarNotificacao = async ({ usuarioId, titulo, mensagem, obraId, tipo }) => {
  return prisma.notificacao.create({
    data: { usuarioId, titulo, mensagem, obraId, tipo },
  });
};

const enviarPush = async (fcmToken, titulo, mensagem) => {
  if (!firebaseInitialized || !fcmToken) return;
  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: { title: titulo, body: mensagem },
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    });
  } catch (err) {
    console.error('Erro ao enviar push:', err.message);
  }
};

const notificarUsuario = async ({ usuarioId, titulo, mensagem, obraId, tipo }) => {
  const [notificacao, usuario] = await Promise.all([
    criarNotificacao({ usuarioId, titulo, mensagem, obraId, tipo }),
    prisma.usuario.findUnique({ where: { id: usuarioId }, select: { fcmToken: true } }),
  ]);
  if (usuario?.fcmToken) {
    await enviarPush(usuario.fcmToken, titulo, mensagem);
  }
  return notificacao;
};

const notificarTodosAdmins = async ({ titulo, mensagem, obraId, tipo }) => {
  const admins = await prisma.usuario.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, fcmToken: true },
  });
  await Promise.all(
    admins.map((admin) =>
      notificarUsuario({ usuarioId: admin.id, titulo, mensagem, obraId, tipo })
    )
  );
};

module.exports = { notificarUsuario, notificarTodosAdmins, criarNotificacao };
