const apiResponse = ({ success = true, message, data = null, meta = null }) => ({
  success,
  message,
  data,
  meta,
});

export { apiResponse };
