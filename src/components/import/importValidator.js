import * as yup from 'yup';

export function deriveColumns(rules) {
  return rules.map(rule => ({
    field: rule.field,
    headerName: rule.label || rule.field,
    type: rule.type || 'string',
    options: rule.oneOf || [],
    editable: true,
    defaultValue: rule.defaultValue ?? '',
  }));
}

export function buildYupSchema(rules) {
  const shape = {};
  rules.forEach(rule => {
    let validator;
    switch (rule.type) {
      case 'string':
        validator = yup.string();
        break;
      case 'number':
        validator = yup.number()
          .transform((value, originalValue) => (originalValue === '' ? null : value))
          .typeError('Must be a number');
        break;
      case 'date':
        validator = yup.date()
          .transform((value, originalValue) => (originalValue === '' ? null : value))
          .typeError('Invalid date');
        break;
      default:
        validator = yup.mixed();
    }
    if (rule.required) validator = validator.required(`${rule.field} is required`);
    if (rule.email) validator = validator.email('Invalid email');
    if (rule.min !== undefined) validator = validator.min(rule.min);
    if (rule.max !== undefined) validator = validator.max(rule.max);
    if (rule.pattern) validator = validator.matches(new RegExp(rule.pattern), 'Invalid format');
    if (rule.oneOf) validator = validator.oneOf(rule.oneOf, `Must be one of: ${rule.oneOf.join(', ')}`);
    if (rule.nullable) validator = validator.nullable();
    shape[rule.field] = validator;
  });
  return yup.object().shape(shape);
}