function ok(res, data = {}, status = 200) {
  return res.status(status).json({ success: true, ...data });
}

function created(res, data = {}) {
  return ok(res, data, 201);
}

function paginated(res, items, meta) {
  return res.status(200).json({ success: true, items, meta });
}

module.exports = { ok, created, paginated };