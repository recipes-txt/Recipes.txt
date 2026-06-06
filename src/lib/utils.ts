export const generateId = (): string =>
  Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

export const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

export const formatDateTime = (dateString: string): string => {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' at ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export const isValidUrl = (str: string): boolean => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

export const slugify = (text: string): string =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const truncate = (text: string, maxLength: number): string =>
  text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
