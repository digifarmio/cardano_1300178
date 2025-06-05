import { NextFunction, Request, Response } from 'express';
import { ConfigService } from '@/config/config.service';
import { JwtService } from '@/modules/core/jwt.service';
import { MintService } from '@/modules/minting/mint.service';
import { ReportService } from '@/modules/minting/report.service';

export class MintController {
  constructor(
    private readonly jwtService = new JwtService(),
    private readonly mintService = new MintService(),
    private readonly reportService = new ReportService(),
    private readonly configService = new ConfigService()
  ) {
    this.getBalance = this.getBalance.bind(this);
    this.getCounts = this.getCounts.bind(this);
    this.getNfts = this.getNfts.bind(this);
    this.getUserNfts = this.getUserNfts.bind(this);
    this.getNftDetailsById = this.getNftDetailsById.bind(this);
    this.getTransactions = this.getTransactions.bind(this);
    this.mintRandom = this.mintRandom.bind(this);
    this.mintSpecific = this.mintSpecific.bind(this);
    this.generateReport = this.generateReport.bind(this);
    this.getAllReports = this.getAllReports.bind(this);
    this.getReportById = this.getReportById.bind(this);
    this.deleteReport = this.deleteReport.bind(this);
    this.downloadReport = this.downloadReport.bind(this);
  }

  async getBalance(_: Request, res: Response, next: NextFunction) {
    try {
      const balance = await this.mintService.getBalance();
      res.json({ success: true, data: balance });
    } catch (error) {
      next(error);
    }
  }

  async getCounts(_: Request, res: Response, next: NextFunction) {
    try {
      const projectUid = this.configService.projectUid;
      const counts = await this.mintService.getCounts(projectUid);
      res.json({ success: true, data: counts });
    } catch (error) {
      next(error);
    }
  }

  async getNfts({ params }: Request, res: Response, next: NextFunction) {
    try {
      const { state, count = 100, page = 1 } = params;
      const collection = await this.mintService.getNfts({
        projectUid: this.configService.projectUid,
        state,
        count: Number(count),
        page: Number(page),
      });
      res.json({ success: true, data: collection });
    } catch (error) {
      next(error);
    }
  }

  async getUserNfts(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization!.split(' ')[1];
      const decoded = this.jwtService.verify(token);
      const fieldUids = decoded.fields || [];

      if (fieldUids.length === 0) {
        res.json({ success: true, data: [] });
        return;
      }

      const nfts = await this.mintService.getUserNfts(fieldUids);
      res.json({ success: true, data: nfts });
    } catch (error) {
      next(error);
    }
  }

  async getNftDetailsById({ params }: Request, res: Response, next: NextFunction) {
    try {
      const { uid } = params;
      const details = await this.mintService.getNftDetailsById(uid);
      res.json({ success: true, data: details });
    } catch (error) {
      next(error);
    }
  }

  async getTransactions(_: Request, res: Response, next: NextFunction) {
    try {
      const transactions = await this.mintService.getTransactions();
      res.json({ success: true, data: transactions });
    } catch (error) {
      next(error);
    }
  }

  async mintRandom(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectUid, receiverAddress, blockchain } = this.configService;
      const count = Number(req.body.count);
      const params = { projectUid, count, receiver: receiverAddress, blockchain };
      const result = await this.mintService.mintRandom(params);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async mintSpecific(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectUid, receiverAddress, blockchain } = this.configService;
      const count = req.body.reserveNfts.length;
      const params = { projectUid, count, receiver: receiverAddress, blockchain };
      const payload = req.body;
      const result = await this.mintService.mintSpecific(params, payload);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async generateReport(_: Request, res: Response, next: NextFunction) {
    try {
      const { reportId, statusUrl } = await this.reportService.generateReport();
      res.json({ success: true, data: { reportId, statusUrl } });
    } catch (error) {
      next(error);
    }
  }

  async getAllReports(_: Request, res: Response, next: NextFunction) {
    try {
      const reports = await this.reportService.getAllReports();
      res.json({ success: true, data: reports });
    } catch (error) {
      next(error);
    }
  }

  async getReportById({ params }: Request, res: Response, next: NextFunction) {
    try {
      const status = await this.reportService.getReportById(params.reportId);
      res.json({ success: true, data: status });
    } catch (error) {
      next(error);
    }
  }

  async deleteReport({ params }: Request, res: Response, next: NextFunction) {
    try {
      const success = await this.reportService.deleteReport(params.reportId);
      res.json({ success, data: { deleted: success } });
    } catch (error) {
      next(error);
    }
  }

  async downloadReport({ params }: Request, res: Response, next: NextFunction) {
    try {
      const fileUrl = await this.reportService.getReportFile(params.reportId, 'csv');
      res.redirect(fileUrl);
    } catch (error) {
      next(error);
    }
  }
}
