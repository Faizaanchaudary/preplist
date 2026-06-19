export function createAppError(status, message) {
  const error = new Error(message);
  error.status = status;
  error.statusText = status >= 500 ? "Server Error" : "Request Error";
  error.data = { message };
  return error;
}
