module.exports = function override(config) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    buffer: false,
  };
  return config;
};
