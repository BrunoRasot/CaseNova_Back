const { z } = require('zod');

const emailSchema = z.string().trim().min(1, 'El correo es obligatorio.').email('Formato de correo no válido.');
const passwordSchema = z.string().min(1, 'La contraseña es obligatoria.').min(8, 'La contraseña debe tener al menos 8 caracteres.');
const nameSchema = z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres.').max(120, 'El nombre es demasiado largo.');

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es obligatoria.')
});

const registerSchema = z.object({
  nombre: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  rol: z.enum(['ADMINISTRADOR', 'VENDEDOR']).optional().default('VENDEDOR')
});

module.exports = { loginSchema, registerSchema };
