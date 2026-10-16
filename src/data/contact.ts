const user = 'rodrigo.matagawa';
const domain = 'gmail.com';
export const email = (): string => [user, domain].join('@');
