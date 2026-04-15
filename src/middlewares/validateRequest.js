const validateRequest = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Datos inválidos.',
      errors: parsed.error.flatten().fieldErrors
    });
  }

  req.body = parsed.data;
  next();
};

module.exports = validateRequest;
