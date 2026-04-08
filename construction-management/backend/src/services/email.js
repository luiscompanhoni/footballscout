const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendPasswordReset = async (email, nome, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/redefinir-senha?token=${token}`;
  await transporter.sendMail({
    from: `"GerObras" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Redefinição de senha — GerObras',
    html: `
      <h2>Olá, ${nome}!</h2>
      <p>Você solicitou a redefinição de senha. Clique no link abaixo:</p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;border-radius:6px;text-decoration:none;">
        Redefinir Senha
      </a>
      <p>O link expira em 1 hora. Se não foi você, ignore este email.</p>
    `,
  });
};

const sendOrcamentoNotificacao = async (email, nome, obraNome, status) => {
  const statusLabel = status === 'APROVADO' ? 'aprovado' : 'reprovado';
  await transporter.sendMail({
    from: `"GerObras" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Orçamento ${statusLabel} — ${obraNome}`,
    html: `
      <h2>Olá!</h2>
      <p>O orçamento da obra <strong>${obraNome}</strong> foi <strong>${statusLabel}</strong> pelo cliente.</p>
      <p>Acesse o sistema para mais detalhes.</p>
    `,
  });
};

module.exports = { sendPasswordReset, sendOrcamentoNotificacao };
