-- Analytics warehouse schema for test runs and action logs.
-- Run this in your warehouse UI (or use: bun run warehouse:schema).

CREATE DATABASE IF NOT EXISTS llm_testing;
USE DATABASE llm_testing;
CREATE SCHEMA IF NOT EXISTS raw;
USE SCHEMA raw;

-- One row per completed test run (summary + metrics).
CREATE TABLE IF NOT EXISTS test_runs (
  test_id                VARCHAR(128) NOT NULL,
  scenario_type          VARCHAR(64) NOT NULL,
  status                 VARCHAR(32) NOT NULL,
  completion_reason      VARCHAR(64),
  target_llm_model       VARCHAR(128) NOT NULL,
  duration_sec            INT,
  started_at             TIMESTAMP_NTZ,
  ended_at               TIMESTAMP_NTZ,
  llm_decisions          INT DEFAULT 0,
  llm_errors             INT DEFAULT 0,
  target_actions         INT DEFAULT 0,
  testing_agent_actions  INT DEFAULT 0,
  target_messages        INT DEFAULT 0,
  testing_agent_messages INT DEFAULT 0,
  total_llm_response_ms   INT DEFAULT 0,
  created_at             TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (test_id)
);

-- One row per action log event (for drill-down / analytics).
CREATE TABLE IF NOT EXISTS action_logs (
  log_id          VARCHAR(128) NOT NULL,
  test_id         VARCHAR(128) NOT NULL,
  source_type     VARCHAR(32) NOT NULL,
  action_category VARCHAR(32) NOT NULL,
  action_detail   VARCHAR(1024),
  ts              TIMESTAMP_NTZ NOT NULL,
  created_at      TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (log_id),
  FOREIGN KEY (test_id) REFERENCES test_runs(test_id)
);
