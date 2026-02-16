import { Request, Response } from "express";
import { SuperAgentService } from "./superAgent.service";

export class SuperAgentController {
  private superAgentService: SuperAgentService;

  constructor() {
    this.superAgentService = new SuperAgentService();
  }

  async query(req: Request, res: Response): Promise<void> {
    try {
      const { query } = req.body;

      if (!query) {
        res.status(400).json({
          success: false,
          error: "Query is required",
        });
        return;
      }

      const result = await this.superAgentService.processQuery(query);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
  console.error("SuperAgent Controller Error:", error);

  res.status(500).json({
    success: false,
    error: (error as Error).message || "Unknown error",
  });
}

  }
}