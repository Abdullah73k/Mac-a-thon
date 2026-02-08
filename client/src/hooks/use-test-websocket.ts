/**
 * WebSocket hook for subscribing to a specific test run's events.
 *
 * Connects to /ws/tests, subscribes with testId, and dispatches
 * typed events to the appropriate state updaters.
 */

import { useCallback, useReducer, useEffect } from "react";
import { useWebSocket } from "./use-websocket";
import type { TestMetrics, TestRunStatus } from "@/types/test";

/** All possible test WS event types from the backend. */
export interface TestStatusChanged {
  type: "test-status-changed";
  testId: string;
  previousStatus: TestRunStatus;
  newStatus: TestRunStatus;
  timestamp: string;
}

export interface TargetLlmDecision {
  type: "target-llm-decision";
  testId: string;
  responseText: string;
  parsedActions: string[];
  responseTimeMs: number;
  timestamp: string;
}

export interface AgentAction {
  type: "agent-action";
  testId: string;
  agentId: string;
  sourceType: "target" | "testing-agent";
  actionType: string;
  actionDetail: string;
  success: boolean;
  timestamp: string;
}

export interface TestChatMessage {
  type: "test-chat-message";
  testId: string;
  agentId: string;
  sourceType: "target" | "testing-agent";
  message: string;
  channel: "text" | "voice";
  timestamp: string;
}

export interface TestMetricsUpdated {
  type: "test-metrics-updated";
  testId: string;
  metrics: TestMetrics;
  timestamp: string;
}

export interface TestCompleted {
  type: "test-completed";
  testId: string;
  scenarioType: string;
  reason: string;
  finalMetrics: TestMetrics;
  durationSeconds: number;
  timestamp: string;
}

export interface TestError {
  type: "test-error";
  testId: string;
  errorMessage: string;
  errorCode: string;
  fatal: boolean;
  timestamp: string;
}

export type TestWsEvent =
  | TestStatusChanged
  | TargetLlmDecision
  | AgentAction
  | TestChatMessage
  | TestMetricsUpdated
  | TestCompleted
  | TestError
  | { type: "pong" };

/** Maximum number of items to keep in each event log array. */
const MAX_LOG_SIZE = 200;

interface TestWsState {
  status: TestRunStatus | null;
  metrics: TestMetrics | null;
  llmDecisions: TargetLlmDecision[];
  agentActions: AgentAction[];
  chatMessages: TestChatMessage[];
  errors: TestError[];
  completed: TestCompleted | null;
}

type TestWsAction =
  | { type: "status"; payload: TestStatusChanged }
  | { type: "metrics"; payload: TestMetricsUpdated }
  | { type: "llm-decision"; payload: TargetLlmDecision }
  | { type: "agent-action"; payload: AgentAction }
  | { type: "chat"; payload: TestChatMessage }
  | { type: "error"; payload: TestError }
  | { type: "completed"; payload: TestCompleted }
  | { type: "reset" };

function appendCapped<T>(arr: T[], item: T): T[] {
  const next = [...arr, item];
  return next.length > MAX_LOG_SIZE ? next.slice(-MAX_LOG_SIZE) : next;
}

function reducer(state: TestWsState, action: TestWsAction): TestWsState {
  switch (action.type) {
    case "status":
      return { ...state, status: action.payload.newStatus };
    case "metrics":
      return { ...state, metrics: action.payload.metrics };
    case "llm-decision":
      return { ...state, llmDecisions: appendCapped(state.llmDecisions, action.payload) };
    case "agent-action":
      return { ...state, agentActions: appendCapped(state.agentActions, action.payload) };
    case "chat":
      return { ...state, chatMessages: appendCapped(state.chatMessages, action.payload) };
    case "error":
      return { ...state, errors: appendCapped(state.errors, action.payload) };
    case "completed":
      return { ...state, completed: action.payload, status: "completed" };
    case "reset":
      return initialState;
  }
}

const initialState: TestWsState = {
  status: null,
  metrics: null,
  llmDecisions: [],
  agentActions: [],
  chatMessages: [],
  errors: [],
  completed: null,
};

export function useTestWebSocket(testId: string | undefined) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleMessage = useCallback((raw: unknown) => {
    const msg = raw as TestWsEvent;
    if (!msg || typeof msg !== "object" || !("type" in msg)) return;

    switch (msg.type) {
      case "test-status-changed":
        dispatch({ type: "status", payload: msg });
        break;
      case "target-llm-decision":
        dispatch({ type: "llm-decision", payload: msg });
        break;
      case "agent-action":
        dispatch({ type: "agent-action", payload: msg });
        break;
      case "test-chat-message":
        dispatch({ type: "chat", payload: msg });
        break;
      case "test-metrics-updated":
        dispatch({ type: "metrics", payload: msg });
        break;
      case "test-completed":
        dispatch({ type: "completed", payload: msg });
        break;
      case "test-error":
        dispatch({ type: "error", payload: msg });
        break;
    }
  }, []);

  const { status: wsStatus, send } = useWebSocket({
    path: "/ws/tests",
    enabled: !!testId,
    onMessage: handleMessage,
  });

  // Subscribe to the test on connect
  useEffect(() => {
    if (wsStatus === "connected" && testId) {
      send({ type: "subscribe", testId });
    }
  }, [wsStatus, testId, send]);

  // Reset state when testId changes
  useEffect(() => {
    dispatch({ type: "reset" });
  }, [testId]);

  return {
    wsStatus,
    ...state,
  };
}
