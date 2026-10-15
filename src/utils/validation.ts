// Validaciones de formularios. El backend vuelve a validar todo:
// estas reglas solo ayudan a mostrar errores antes de enviar.

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
export const isPhone = (value: string) => /^[0-9+()\-\s]{6,25}$/.test(value.trim());

export type Errors<T> = Partial<Record<keyof T, string>>;

export function hasErrors<T>(errors: Errors<T>) {
  return Object.values(errors).some(Boolean);
}
