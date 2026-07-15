const startedAt = Date.now();
let shuttingDown = false;

const markShuttingDown = () => {
  shuttingDown = true;
};

const getRuntimeState = () => ({
  startedAt,
  uptimeSeconds: Math.round(process.uptime()),
  shuttingDown,
});

const isShuttingDown = () => shuttingDown;

export { getRuntimeState, isShuttingDown, markShuttingDown };