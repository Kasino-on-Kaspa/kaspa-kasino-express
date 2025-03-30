import { DB } from "@/database";
import { GameStatsSchema } from "@schema/game-stats.schema";
import { users } from "@schema/users.schema";
import { eq, sql } from "drizzle-orm";

type TLeaderboard = {
  address: string;
  username: string;
  totalWonAmount: bigint;
  totalBetAmount: bigint;
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
      ...(users.username ? { username: users.username } : {username: sql`Anonymous`}),
      totalWonAmount: GameStatsSchema.total_won_amount || 0n,
      totalBetAmount: GameStatsSchema.total_bet_amount || 0n,
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
}
