import jwt from "jsonwebtoken";

export interface JwtPayload {
  userId: string;
}

export const generateAccessToken = (userId: string) => {
  return jwt.sign(
    { userId },
    process.env.ACCESS_TOKEN_SECRET!,
    {
      expiresIn: "15m",
    }
  );
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET!,
    {
      expiresIn: "7d",
    }
  );
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET!
  ) as JwtPayload;
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(
    token,
    process.env.REFRESH_TOKEN_SECRET!
  ) as JwtPayload;
};