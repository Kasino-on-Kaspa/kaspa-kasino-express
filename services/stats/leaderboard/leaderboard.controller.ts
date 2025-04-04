import { LeaderboardModel } from "./leaderboard.model";
import { Response, Request } from "express";

export class LeaderboardController {
  private model = new LeaderboardModel();

  public async getLeaderboard(req: Request, res: Response): Promise<void> {
    const leaderboard = await this.model.getLeaderboard();
    res.json(leaderboard);
  }

  public async getHighWinsLuckyWinsUsingGameName(
    req: Request,
    res: Response
  ): Promise<void> {
    const gameName = req.params.gameName;
    const highWins = await this.model.getHighWinsLuckyWinsUsingGameName(
      gameName
    );
    res.json(highWins);
  }

  public async refreshLeaderboard(): Promise<void> {
    await this.model.refreshLeaderboard();
  }
}
