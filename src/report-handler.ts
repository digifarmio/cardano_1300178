import { SQSEvent } from 'aws-lambda';
import { ReportService } from '@/modules/minting/report.service';

const reportService = new ReportService();

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log(`[SQS Handler] Processing ${event.Records.length} records`);

  try {
    for (const record of event.Records) {
      const body = JSON.parse(record.body);
      console.log(`[SQS Handler] Processing message:`, {
        reportId: body.reportId,
        trigger: body.trigger,
        batchIndex: body.batchIndex,
        nftsCount: body.nfts?.length,
      });

      if (body.trigger && body.reportId) {
        console.log(`[SQS Handler] Starting report generation for ${body.reportId}`);
        await reportService.initializeReport(body.reportId);
      } else if (body.reportId && body.nfts && Array.isArray(body.nfts)) {
        console.log(
          `[SQS Handler] Processing batch ${body.batchIndex} for report ${body.reportId} with ${body.nfts.length} NFTs`
        );
        await reportService.processBatch(body.reportId, body.nfts);
      } else if (body.finalize && body.reportId) {
        console.log(`[SQS Handler] Finalizing report ${body.reportId}`);
        await reportService.finalizeReport(body.reportId);
      } else {
        console.warn(`[SQS Handler] Invalid message format:`, body);
      }
    }
  } catch (error) {
    console.error('[SQS Handler] Error processing records:', error);
    throw error;
  }
};
