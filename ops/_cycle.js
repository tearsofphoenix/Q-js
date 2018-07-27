const shared = {}

export function add(key, value) {
  shared[key] = value
}

export function get(key) {
  return shared[key]
}

export default {
  add,
  get
}
