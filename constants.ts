
import { AgentName, AgentStatus, PipelineState } from './types';

export const AGENT_NAMES: AgentName[] = [
  AgentName.CONTENT_INGESTION,
  AgentName.TEXTUAL_ANALYSIS,
  AgentName.EMOTION_ANALYSIS,
  AgentName.VISUAL_ANALYSIS,
  AgentName.SOURCE_INTELLIGENCE,
  AgentName.FINAL_SYNTHESIS,
];

export const INITIAL_PIPELINE_STATE: PipelineState = {
  [AgentName.CONTENT_INGESTION]: { status: AgentStatus.PENDING },
  [AgentName.TEXTUAL_ANALYSIS]: { status: AgentStatus.PENDING },
  [AgentName.EMOTION_ANALYSIS]: { status: AgentStatus.PENDING },
  [AgentName.VISUAL_ANALYSIS]: { status: AgentStatus.PENDING },
  [AgentName.SOURCE_INTELLIGENCE]: { status: AgentStatus.PENDING },
  [AgentName.FINAL_SYNTHESIS]: { status: AgentStatus.PENDING },
};