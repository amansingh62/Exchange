import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";

export const send = async (req: Request, res: Response) => {
  try {
    const { username, amount } = req.body;

    if (!username || typeof username !== "string") {
      return res.status(400).json({
        message: "Username is required",
      });
    }

    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({
        message: "Invalid amount",
      });
    }

    const senderWallet = await prisma.wallet.findUnique({
      where: {
        userId: req.userId,
      },
      select: {
        id: true,
        userId: true,
        balance: true,
      },
    });

    if (!senderWallet) {
      return res.status(404).json({
        message: "Sender wallet not found",
      });
    }

    const receiverWallet = await prisma.user.findUnique({
      where: {
        username,
      },
      include: {
        wallet: true,
      },
    });

    if (!receiverWallet || !receiverWallet.wallet) {
      return res.status(404).json({
        message: "Receiver wallet not found",
      });
    }

    const receiverWalletId = receiverWallet.wallet.id;

    if (senderWallet.id === receiverWalletId) {
      return res.status(403).json({
        message: "You can't send money to yourself",
      });
    }

    if (senderWallet.balance.toNumber() < amount) {
      return res.status(400).json({
        message: "Insufficient balance",
      });
    }

    await prisma.$transaction(async (tx) => {
      const senderBalance = await tx.wallet.updateMany({
        where: {
          id: senderWallet.id,
          balance: {
            gte: amount,
          },
        },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });

      if (senderBalance.count === 0) {
        throw new Error("Insufficient balance");
      }

      await tx.wallet.update({
        where: {
          id: receiverWalletId,
        },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      await tx.transaction.create({
        data: {
          referenceId: crypto.randomUUID(),
          senderWalletId: senderWallet.id,
          receiverWalletId: receiverWalletId,
          amount,
          status: "SUCCESS",
          type: "TRANSFER",
        },
      });
    });

    return res.status(200).json({
      message: "Money transferred successfully",
    });
  } catch (error) {
    console.error("Transfer Error:", error);

    if (error instanceof Error && error.message === "Insufficient balance") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const history = async (req: Request, res: Response) => {
  const senderWallet = await prisma.wallet.findUnique({
    where: {
      userId: req.userId,
    },
  });

  if (!senderWallet) {
    return res.status(404).json({
      message: "Sender wallet not found",
    });
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      OR: [
        {
          senderWalletId: senderWallet.id,
        },
        {
          receiverWalletId: senderWallet.id,
        },
      ],
    },

    orderBy: {
      createdAt: "desc",
    },

    select: {
      id: true,
      amount: true,
      status: true,
      createdAt: true,
      senderWalletId: true,
      receiverWalletId: true,
      type: true,

      senderWallet: {
        select: {
          user: {
            select: {
              username: true,
            },
          },
        },
      },

      receiverWallet: {
        select: {
          user: {
            select: {
              username: true,
            },
          },
        },
      },
    },
  });

  const history = transactions.map((tx) => {
    const isDebit = tx.senderWalletId === senderWallet.id;

    return {
      id: tx.id,
      amount: tx.amount,
      status: tx.status,
      type: tx.type,
      createdAt: tx.createdAt,

      direction: isDebit ? "DEBIT" : "CREDIT",

      otherParty: isDebit
        ? tx.receiverWallet?.user.username
        : tx.senderWallet?.user.username,
    };
  });

  return res.status(200).json({
    transactions: history,
  });
};

export const search = async (req: Request, res: Response) => {
  const q = (req.query.q as string) || "";

  if (!q.trim())
    return res.status(400).json({ message: "Search query is required" });

  const users = await prisma.user.findMany({
    where: {
      id: {
        not: req.userId,
      },
      username: {
        contains: q,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      username: true,
    },
  });

  return res.status(200).json({ users });
};

export const dashboard = async (req: Request, res: Response) => {
  const [user, transaction] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: req.userId,
      },
      select: {
        id: true,
        username: true,
        wallet: {
          select: {
            balance: true,
          },
        },
      },
    }),

    prisma.transaction.findMany({
      where: {
        OR: [
          {
            senderWallet: {
              userId: req.userId,
            },
          },
          {
            receiverWallet: {
              userId: req.userId,
            },
          },
        ],
      },

      select: {
        amount: true,
        status: true,
        type: true,
        createdAt: true,
        senderWallet: {
          select: {
            user: {
              select: {
                username: true,
              },
            },
          },
        },
        receiverWallet: {
          select: {
            user: {
              select: {
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
  ]);

  return res.status(200).json({
    user,
    recentTransactions: transaction,
});
};
