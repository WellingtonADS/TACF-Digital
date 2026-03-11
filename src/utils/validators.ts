export function required(value: unknown) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

export function isEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value);
}

export default { required, isEmail };


