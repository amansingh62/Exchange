import type { Response } from "express";

export const sendAccessToken = (
  res: Response,
  token: string
) => {
  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });
};

export const sendRefreshToken = (
  res: Response,
  token: string
) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearTokens = (
  res: Response
) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
};