const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.id },
      select: { id: true, nome: true, email: true, role: true },
    });
    if (!usuario) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }
    req.user = usuario;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  next();
};

const requireCliente = (req, res, next) => {
  if (!['ADMIN', 'CLIENTE'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  next();
};

module.exports = { authenticate, requireAdmin, requireCliente };
