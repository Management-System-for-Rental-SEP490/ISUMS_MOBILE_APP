type Credentials = {
  username: string;
  password: string;
};

export const mockCredentials: Credentials = {
  username: "admin",
  password: "isums123",
};

export const validateCredentials = (username: string, password: string) =>
  username === mockCredentials.username && password === mockCredentials.password;

