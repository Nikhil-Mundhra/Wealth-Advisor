import { startTestApp } from '../../support/test-app.ts';
import { runAuthFlowSuite } from './auth-flow.suite.ts';

runAuthFlowSuite(() => startTestApp());
