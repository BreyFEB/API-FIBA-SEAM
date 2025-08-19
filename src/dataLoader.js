// dataLoader.js
// Utility to load JSON data from a given path
export async function loadJSON(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.statusText}`);
  }
  return await response.json();
}
