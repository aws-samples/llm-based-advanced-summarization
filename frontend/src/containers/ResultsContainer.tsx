import SummarizationSteps from '../components/SummarizationSteps';
import SummarizationResults from '../components/SummarizationResults';
import LoadingProgress from '../components/LoadingProgress';
import EmptySummarizationResults from '../components/EmptySummarizationResults';

export interface SummarizationResultsProps {
  // activeTab: string;
  summarizationOutput: string;
  steps: any[];
  time: string;
  resultsOrStepsActiveTab: number;
  progress: number;
}

function ResultsContainer({ summarizationOutput, steps, time, resultsOrStepsActiveTab, progress }: SummarizationResultsProps) {
  const isDataEmpty: boolean = !summarizationOutput && (!steps || steps.length === 0);
  if (isDataEmpty) {
    return progress == 0
      ? <EmptySummarizationResults />
      : <LoadingProgress progress={progress} />
  }

  return (
    <div>
      { resultsOrStepsActiveTab == 0 && <SummarizationResults results={summarizationOutput} time={time} /> }
      { resultsOrStepsActiveTab == 1 && <SummarizationSteps steps={steps} /> }
    </div>
  )
}

export default ResultsContainer;