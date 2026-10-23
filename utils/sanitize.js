function pick(obj = {}, keys = []) {
  const out = {};
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') out[k] = obj[k];
  }
  return out;
}

function omit(obj = {}, keys = []) {
  const out = { ...obj };
  for (const k of keys) delete out[k];
  return out;
}

function sanitizeConfig(code, config = {}, allowlist = {}) {
  const allowed = allowlist[code] || [];
  return pick(config, allowed);
}

module.exports = { pick, omit, sanitizeConfig };