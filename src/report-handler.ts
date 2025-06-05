import { SQSEvent } from 'aws-lambda';
import { ReportService } from '@/modules/minting/report.service';

const reportService = new ReportService();

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log('Received SQS event:', JSON.stringify(event, null, 2));

  try {
    for (const record of event.Records) {
      const { reportId } = JSON.parse(record.body);
      console.log(`Starting processing for report ${reportId}`);

      await reportService.processReport(reportId);

      console.log(`Completed processing for report ${reportId}`);
    }
  } catch (error) {
    console.error('Error processing report:', error);
    throw error;
  }
};
