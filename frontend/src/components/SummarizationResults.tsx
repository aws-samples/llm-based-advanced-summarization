import SummarizationSteps from './SummarizationSteps';
import SummarizationResultsContent from './SummarizationResultsContent';

export interface SummarizationResultsProps {
  // activeTab: string;
  summarizationOutput: string;
  steps: any[];
  resultsOrStepsActiveTab: number;
}

function SummarizationResults({ summarizationOutput, steps, resultsOrStepsActiveTab }: SummarizationResultsProps) {
  return (
    <div>
      { resultsOrStepsActiveTab == 0 && <SummarizationResultsContent results={summarizationOutput} /> }
      {/* { resultsOrStepsActiveTab == 0 && <ProgressView /> }  */}
      { resultsOrStepsActiveTab == 1 && <SummarizationSteps steps={steps} /> }
    </div>
  )
}

export default SummarizationResults;