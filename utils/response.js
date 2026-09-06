export const sendSuccess = (res, data = {}, message = 'Success', status = 200, meta = null) => {
  const payload = {
    success: true,
    message,
    data,
  };
  if (meta) {
    payload.meta = meta;
  }
  return res.status(status).json(payload);
};

export const sendError = (res, message = 'Internal Server Error', status = 500, errors = null) => {
  const payload = {
    success: false,
    message,
  };
  if (errors) {
    payload.errors = errors;
  }
  return res.status(status).json(payload);
};
