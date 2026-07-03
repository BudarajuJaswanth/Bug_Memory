// Type-safe client for the Bug Memory FastAPI Backend at http://localhost:8000

export interface ProjectResponse {
  name: string;
  created_at: string;
}

export interface ProjectListItem {
  name: string;
  bug_count: number;
}

export interface ProjectListResponse {
  projects: ProjectListItem[];
}

export interface SimpleStatusResponse {
  status: string;
}

export interface BugCreateData {
  project: string;
  error: string;
  root_cause: string;
  fix: string;
  file: string;
  tags: string[];
}

export interface BugCreateResponse {
  id: number;
  status: string;
}

export interface GraphNode {
  id: string;
  label: string;
  tags: string[];
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface ProjectGraphResponse {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface RecallResultItem {
  text: string;
  root_cause?: string;
  fix?: string;
}

export interface RecallResponse {
  session_id: string;
  source: 'memory' | 'ai_suggested' | 'error';
  results: RecallResultItem[];
}

export interface FeedbackData {
  session_id: string;
  helpful: boolean;
  note: string;
}

export interface ConfirmFixData {
  session_id: string;
  source: 'memory' | 'ai_suggested';
  project: string;
  error: string;
  root_cause: string;
  fix: string;
  file: string;
  tags: string[];
}

import { showToast } from './toast';

function notifyError(message: string) {
  showToast(message, 'error');
}

const BASE_URL = 'http://localhost:8000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errJson = await response.json();
        if (errJson && errJson.detail) {
          errorMsg = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
        }
      } catch {
        // Failed to parse JSON error, fallback to status code
      }
      throw new Error(errorMsg);
    }

    return (await response.json()) as T;
  } catch (error: any) {
    const message = error.message || 'Network request failed';
    notifyError(message);
    throw error;
  }
}

export const api = {
  // 1. POST /api/projects
  createProject: (name: string): Promise<ProjectResponse> => {
    return request<ProjectResponse>('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  // 2. GET /api/projects
  getProjects: (): Promise<ProjectListResponse> => {
    return request<ProjectListResponse>('/api/projects', {
      method: 'GET',
    });
  },

  // 3. DELETE /api/projects/{name}
  deleteProject: (name: string): Promise<SimpleStatusResponse> => {
    return request<SimpleStatusResponse>(`/api/projects/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
  },
  
  // GET /api/projects/{name}/bugs
  getProjectBugs: (name: string): Promise<{ bugs: any[] }> => {
    return request<{ bugs: any[] }>(`/api/projects/${encodeURIComponent(name)}/bugs`, {
      method: 'GET',
    });
  },

  // 4. POST /api/bugs
  createBug: (bugData: BugCreateData): Promise<BugCreateResponse> => {
    return request<BugCreateResponse>('/api/bugs', {
      method: 'POST',
      body: JSON.stringify(bugData),
    });
  },

  // 5. GET /api/projects/{name}/graph
  getProjectGraph: (name: string): Promise<ProjectGraphResponse> => {
    return request<ProjectGraphResponse>(`/api/projects/${encodeURIComponent(name)}/graph`, {
      method: 'GET',
    });
  },

  // 6. POST /api/bugs/recall
  recallBug: (project: string, errorText: string, sessionId: string): Promise<RecallResponse> => {
    return request<RecallResponse>('/api/bugs/recall', {
      method: 'POST',
      body: JSON.stringify({
        project,
        error_text: errorText,
        session_id: sessionId,
      }),
    });
  },

  // 7. POST /api/feedback
  submitFeedback: (feedback: FeedbackData): Promise<SimpleStatusResponse> => {
    return request<SimpleStatusResponse>('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(feedback),
    });
  },

  // 8. POST /api/bugs/confirm-fix
  confirmFix: (confirmData: ConfirmFixData): Promise<SimpleStatusResponse> => {
    return request<SimpleStatusResponse>('/api/bugs/confirm-fix', {
      method: 'POST',
      body: JSON.stringify(confirmData),
    });
  },
};
