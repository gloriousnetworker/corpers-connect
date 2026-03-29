'use client';

import { useOpportunitiesStore } from '@/store/opportunities.store';
import OpportunitiesHome from './OpportunitiesHome';
import OpportunityDetail from './OpportunityDetail';
import CreateOpportunityForm from './CreateOpportunityForm';
import EditOpportunityForm from './EditOpportunityForm';
import MyOpportunities from './MyOpportunities';
import SavedOpportunities from './SavedOpportunities';
import MyApplications from './MyApplications';
import ApplicationsViewer from './ApplicationsViewer';

/**
 * OpportunitiesSection — SPA router for the Opportunities board.
 *
 * View stack:
 *   feed → detail → apply (modal) / edit
 *   feed → create
 *   feed → my-posts → applications-viewer
 *   feed → saved
 *   feed → my-applications
 */
export default function OpportunitiesSection() {
  const { view } = useOpportunitiesStore();

  switch (view) {
    case 'detail':              return <OpportunityDetail />;
    case 'create':              return <CreateOpportunityForm />;
    case 'edit':                return <EditOpportunityForm />;
    case 'my-posts':            return <MyOpportunities />;
    case 'saved':               return <SavedOpportunities />;
    case 'my-applications':     return <MyApplications />;
    case 'applications-viewer': return <ApplicationsViewer />;
    default:                    return <OpportunitiesHome />;
  }
}
