function successResponse(res, data = null, message = 'OK', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function errorResponse(res, message, status = 400, code = null, details = null) {
  const body = { success: false, message };
  if (code) body.code = code;
  if (details) body.details = details;
  return res.status(status).json(body);
}

function ok(res, data = {}, status = 200) {
  return res.status(status).json({ success: true, ...data });
}

function created(res, data = {}) {
  return ok(res, data, 201);
}

function paginated(res, items, meta) {
  return res.status(200).json({ success: true, items, meta });
}

module.exports = { successResponse, errorResponse, ok, created, paginated };