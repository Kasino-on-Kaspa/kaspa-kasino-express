import { DB } from "@/database";
import { GameStatsSchema } from "@schema/game-stats.schema";
import { users } from "@schema/users.schema";
import { eq, sql } from "drizzle-orm";
import { coinflip } from "@schema/games/coinflip.schema";
import { dieroll } from "@schema/games/dieroll.schema";
type TLeaderboard = {
  address: string;
  username: string;
  totalWonAmount: string;
  totalBetAmount: string;
  betAmountRank: number;
  wonAmountRank: number;
};

export class LeaderboardModel {
  private leaderboard?: TLeaderboard[];
  public async getLeaderboard(): Promise<TLeaderboard[]> {
    if (!this.leaderboard) {
      this.leaderboard = await this.getLeaderboardFromDB();
    }

    return this.leaderboard;
  }

  private async getLeaderboardFromDB(): Promise<TLeaderboard[]> {
    const leaderboard = await DB.select({
      address: users.address,
      username: sql`COALESCE(${users.username}, 'Anonymous')`,
      totalWonAmount: sql<string>`CAST(${GameStatsSchema.total_won_amount} AS VARCHAR)`,
      totalBetAmount: sql<string>`CAST(${GameStatsSchema.total_bet_amount} AS VARCHAR)`,
      betAmountRank: sql<number>`RANK() OVER (ORDER BY ${GameStatsSchema.total_bet_amount} DESC)`,
      wonAmountRank: sql<number>`RANK() OVER (ORDER BY ${GameStatsSchema.total_won_amount} DESC)`,
    })
      .from(GameStatsSchema)
      .innerJoin(users, eq(GameStatsSchema.account_id, users.id))
      .limit(10);
    return leaderboard as TLeaderboard[];
  }

  public async refreshLeaderboard(): Promise<void> {
    this.leaderboard = await this.getLeaderboardFromDB();
  }

  public async getHighWinsLuckyWinsUsingGameName(gameName: string): Promise<{
    highWins: any[];
    luckyWins: any[];
  }> {
    if (gameName === "coinflip") {
      const highWins = await DB.select({
        id: coinflip.id,
        sessionId: coinflip.sessionId,
        playerChoice: coinflip.playerChoice,
        result: coinflip.result,
        level: coinflip.level,
        multiplier: coinflip.multiplier,
        createdAt: coinflip.createdAt,
      })
        .from(coinflip)
        .where(eq(coinflip.client_won, true))
        .orderBy(sql`${coinflip.multiplier} * ${coinflip.level} DESC`)
        .limit(5);

      const luckyWins = await DB.select({
        id: coinflip.id,
        sessionId: coinflip.sessionId,
        playerChoice: coinflip.playerChoice,
        result: coinflip.result,
        level: coinflip.level,
        multiplier: coinflip.multiplier,
        createdAt: coinflip.createdAt,
      })
        .from(coinflip)
        .where(eq(coinflip.client_won, true))
        .orderBy(sql`${coinflip.multiplier} DESC`)
        .limit(5);

      return { highWins, luckyWins };
    } else {
      const highWins = await DB.select({
        id: dieroll.id,
        sessionId: dieroll.sessionId,
        target: dieroll.target,
        condition: dieroll.condition,
        result: dieroll.result,
        multiplier: dieroll.multiplier,
        createdAt: dieroll.created_at,
      })
        .from(dieroll)
        .where(eq(dieroll.status, "WON"))
        .orderBy(sql`${dieroll.multiplier} DESC`)
        .limit(5);

      const luckyWins = await DB.select({
        id: dieroll.id,
        sessionId: dieroll.sessionId,
        target: dieroll.target,
        condition: dieroll.condition,
        result: dieroll.result,
        multiplier: dieroll.multiplier,
        createdAt: dieroll.created_at,
      })
        .from(dieroll)
        .where(eq(dieroll.status, "WON"))
        .orderBy(sql`${dieroll.multiplier} DESC`)
        .limit(5);

      return { highWins, luckyWins };
    }
  }
}
